import { returnToPoetSelection } from '../lib/navigation/flowNavigation';
import '../styles/flow-navigation.css';

export function FlowBackButton() {
  return (
    <button
      type="button"
      className="flow-back"
      onClick={returnToPoetSelection}
    >
      Choose another poet
    </button>
  );
}
