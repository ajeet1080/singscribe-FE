import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { GridItem } from "@chakra-ui/react";
import UserRecording from "./components/UserRecroding";
import Retrival from "./components/Retrival";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Retrival />} />
        <Route path="/retrival" element={<UserRecording />} />
      </Routes>
    </Router>
  );
}

export default App;
