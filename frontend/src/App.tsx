// import { BrowserRouter, Route, Routes } from 'react-router-dom'
// import { Signup } from './pages/Signup'
// import { Signin } from './pages/Signin'
// import { Blog } from './pages/Blog'
// import { Blogs } from "./pages/Blogs";
// import { Publish } from './pages/Publish';
// import { Home } from './pages/Home';

// function App() {

//   return (
//     <>
//       <BrowserRouter>
//         <Routes> 
//           <Route path='/' element={<Home />}/>
//           <Route path="/signup" element={<Signup />} />
//           <Route path="/signin" element={<Signin />} />
//           <Route path="/blog/:id" element={<Blog />} />
//           <Route path="/blogs" element={<Blogs/>} />
//           <Route path="/publish" element={<Publish />} />
//         </Routes>
//       </BrowserRouter>
//     </>
//   )
// }

// export default App/

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Signup } from "./pages/Signup";
import { Signin } from "./pages/Signin";
import { Blog } from "./pages/Blog";
import { Blogs } from "./pages/Blogs";
import { Publish } from "./pages/Publish";
import { Home } from "./pages/Home";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />

        {/* Protected routes */}
        <Route
          path="/blogs"
          element={
            <ProtectedRoute>
              <Blogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blog/:id"
          element={
            <ProtectedRoute>
              <Blog />
            </ProtectedRoute>
          }
        />

        <Route
          path="/publish"
          element={
            <ProtectedRoute>
              <Publish />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
