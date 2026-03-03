import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./Home";
import Submit from "./SubmitComp";
import Track from "./TrackComplaint";
import Search from "./SearchOrg";
import Organisation from "./OrgView";//
import DepLogin from "./DepLogin";
import ManagerLogin from "./ManagerLogin";//
import CreateOrg from "./CreateOrg";//
import DepDashBoard from "./DepDashboard";//
import ManagerDash from "./ManagerDash";
import { AuthProvider } from "./AuthContext";
function App() {
  return (
    <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/track" element={<Track />} />
        <Route path="/search" element={<Search />} />
        <Route path="/organisation/:slug" element={<Organisation />} />

        <Route path="/employee-login" element={<DepLogin />} />
        <Route path="/manager-login" element={<ManagerLogin />} />
        <Route path="/create-org" element={<CreateOrg />} />
        <Route path="/depdashboard" element={<DepDashBoard />} />
        <Route path="/managerdashboard" element={<ManagerDash />} />

      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;