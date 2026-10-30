import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Compression } from './components/Compression';
import { Sessions } from './components/Sessions';
import { Policies } from './components/Policies';
import { Docs } from './components/Docs';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/compression" element={<Compression />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/docs" element={<Docs />} />
      </Routes>
    </Layout>
  );
}

export default App;

