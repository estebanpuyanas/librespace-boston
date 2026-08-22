import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout';
import Home from './components/Home';
import NotFound from './components/NotFound';
import { initTheme } from './utils/theme';
import { initTextSize } from './utils/textSize';

const App = () => {
  useEffect(() => {
    initTheme();
    initTextSize();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route index element={<Home />} />
            {/* Catch-all: any unmatched path under / renders 404 */}
            <Route path='*' element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
