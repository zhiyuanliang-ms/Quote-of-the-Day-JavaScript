import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ContextProvider } from './pages/AppContext';
import Layout from './Layout';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Beta from './pages/Beta';
import Register from './pages/Register';
import Login from './pages/Login';


function App() {
  return (
    <ContextProvider>
      <Router>
      <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/beta" element={<Beta />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Layout>
      </Router>
    </ContextProvider>
  );
}

export default App;
