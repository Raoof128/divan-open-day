import type { MotionPreference } from '../contracts/app';

export interface MotionControlProps {
  readonly value: MotionPreference;
  readonly onChange: (value: MotionPreference) => void;
}

export function MotionControl({ value, onChange }: MotionControlProps) {
  return (
    <div className="motion-control">
      <label htmlFor="motion-preference">Motion</label>
      <select
        id="motion-preference"
        value={value}
        onChange={(event) =>
          onChange(event.currentTarget.value as MotionPreference)
        }
      >
        <option value="system">System preference</option>
        <option value="reduced">Reduced</option>
        <option value="full">Full</option>
      </select>
    </div>
  );
}
