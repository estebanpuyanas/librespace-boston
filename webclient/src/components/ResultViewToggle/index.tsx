import { List, Map } from 'lucide-react';
import './index.css';

export type ResultView = 'list' | 'map';

interface ResultViewToggleProps {
  onChange: (view: ResultView) => void;
  view: ResultView;
}

const views: ResultView[] = ['list', 'map'];

const ResultViewToggle = ({ onChange, view }: ResultViewToggleProps) => {
  const selectAndFocus = (nextView: ResultView) => {
    onChange(nextView);
    document.getElementById(`result-view-${nextView}`)?.focus();
  };

  return (
    <div className='result-view-toggle' role='tablist' aria-label='Result view'>
      {views.map(option => {
        const selected = option === view;
        const label = option === 'list' ? 'List' : 'Map';
        const Icon = option === 'list' ? List : Map;

        return (
          <button
            aria-controls={`${option}-results-panel`}
            aria-selected={selected}
            className={`result-view-toggle-option ${selected ? 'is-selected' : ''}`}
            id={`result-view-${option}`}
            key={option}
            onClick={() => onChange(option)}
            onKeyDown={event => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const nextView = event.key === 'ArrowLeft' || event.key === 'Home' ? 'list' : 'map';
              selectAndFocus(nextView);
            }}
            role='tab'
            tabIndex={selected ? 0 : -1}
            type='button'
          >
            <Icon aria-hidden='true' size={16} />
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ResultViewToggle;
