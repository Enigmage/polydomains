import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Resolve from "./Resolve";
import App from "./App";
import ListDomains from "./ListDomains";

const AppRoutes = () => {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/resolve" element={<Resolve />} />
            <Route path="/list" element={<ListDomains />}/>
        </Routes>
    </Router>
  );
};

export default AppRoutes;