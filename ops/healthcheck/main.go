package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	publicRoot = "/srv"
	healthURL  = "http://127.0.0.1:8080/healthz"
)

type releaseManifest struct {
	BuildProfile        string `json:"buildProfile"`
	ProductionEligible  bool   `json:"productionEligible"`
	ContentPath         string `json:"contentPath"`
	ContentSHA256       string `json:"contentSha256"`
	AssetManifestPath   string `json:"assetManifestPath"`
	AssetManifestSHA256 string `json:"assetManifestSha256"`
	HafezCount          int    `json:"hafezCount"`
	RumiCount           int    `json:"rumiCount"`
	ItemCount           int    `json:"itemCount"`
}

func main() {
	if err := verify(); err != nil {
		fmt.Fprintf(os.Stderr, "DIVAN health check failed: %v\n", err)
		os.Exit(1)
	}
}

func verify() error {
	if info, err := os.Stat(filepath.Join(publicRoot, "index.html")); err != nil || !info.Mode().IsRegular() {
		return errors.New("index document is missing or invalid")
	}

	manifest, err := readReleaseManifest(filepath.Join(publicRoot, "release.json"))
	if err != nil {
		return err
	}
	if err := validateReleaseManifest(manifest); err != nil {
		return err
	}
	if err := verifyPublicFile(manifest.ContentPath, manifest.ContentSHA256); err != nil {
		return fmt.Errorf("content integrity: %w", err)
	}
	if err := verifyPublicFile(manifest.AssetManifestPath, manifest.AssetManifestSHA256); err != nil {
		return fmt.Errorf("asset manifest integrity: %w", err)
	}
	return verifyOrigin()
}

func readReleaseManifest(path string) (releaseManifest, error) {
	file, err := os.Open(path)
	if err != nil {
		return releaseManifest{}, errors.New("release manifest is unavailable")
	}
	defer file.Close()

	var manifest releaseManifest
	if err := json.NewDecoder(io.LimitReader(file, 1<<20)).Decode(&manifest); err != nil {
		return releaseManifest{}, errors.New("release manifest is invalid")
	}
	return manifest, nil
}

func validateReleaseManifest(manifest releaseManifest) error {
	if manifest.BuildProfile != "production" || !manifest.ProductionEligible {
		return errors.New("release is not production eligible")
	}
	if manifest.HafezCount != 60 || manifest.RumiCount != 60 || manifest.ItemCount != 120 {
		return errors.New("release corpus count is not exactly 60/60/120")
	}
	if manifest.ItemCount != manifest.HafezCount+manifest.RumiCount {
		return errors.New("release corpus total is inconsistent")
	}
	if !isLowerHexDigest(manifest.ContentSHA256) || manifest.ContentPath != "/content/"+manifest.ContentSHA256+".json" {
		return errors.New("content path or digest is invalid")
	}
	if !isLowerHexDigest(manifest.AssetManifestSHA256) || manifest.AssetManifestPath != "/assets/"+manifest.AssetManifestSHA256+".json" {
		return errors.New("asset manifest path or digest is invalid")
	}
	return nil
}

func isLowerHexDigest(value string) bool {
	if len(value) != sha256.Size*2 {
		return false
	}
	decoded, err := hex.DecodeString(value)
	return err == nil && hex.EncodeToString(decoded) == value
}

func verifyPublicFile(publicPath, expectedDigest string) error {
	cleanPath := filepath.Clean(filepath.FromSlash(strings.TrimPrefix(publicPath, "/")))
	if cleanPath == "." || cleanPath == ".." || filepath.IsAbs(cleanPath) || strings.HasPrefix(cleanPath, ".."+string(filepath.Separator)) {
		return errors.New("public path escapes the release root")
	}

	file, err := os.Open(filepath.Join(publicRoot, cleanPath))
	if err != nil {
		return errors.New("public file is unavailable")
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return errors.New("public file cannot be hashed")
	}
	if hex.EncodeToString(hash.Sum(nil)) != expectedDigest {
		return errors.New("public file digest does not match")
	}
	return nil
}

func verifyOrigin() error {
	client := &http.Client{
		Timeout: 5 * time.Second,
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return http.ErrUseLastResponse
		},
		Transport: &http.Transport{
			DisableKeepAlives: true,
		},
	}

	response, err := client.Get(healthURL)
	if err != nil {
		return errors.New("origin health endpoint is unavailable")
	}
	defer response.Body.Close()

	body, err := io.ReadAll(io.LimitReader(response.Body, 16))
	if err != nil || response.StatusCode != http.StatusOK || string(body) != "ok" {
		return errors.New("origin health endpoint returned an invalid response")
	}
	return nil
}
