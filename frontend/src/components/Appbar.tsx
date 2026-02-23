// export const Appbar = ({ onSearch }: { onSearch?: (v: string) => void }) => {
//   return (
//     <div className="border-b px-6 py-3 flex justify-between items-center">
//       <div className="flex items-center gap-4">
//         <input
//           placeholder="Search recommendations..."
//           className="border rounded px-3 py-1 text-sm w-64"
//           onChange={(e) => onSearch?.(e.target.value)}
//         />
//       </div>

//       <button className="bg-green-600 text-white px-4 py-2 rounded">
//         New
//       </button>
//     </div>
//   );
// };

import { useNavigate } from "react-router-dom";

export const Appbar = ({ onSearch }: { onSearch?: (v: string) => void }) => {
  const navigate = useNavigate();

  function handleSignout() {
    localStorage.removeItem("token");
    navigate("/signin");
  }

  return (
    <div className="border-b px-6 py-3 flex justify-between items-center sticky top-0 bg-white z-10">
      {/* Logo */}
      <div
        className="text-xl font-bold cursor-pointer"
        onClick={() => navigate("/blogs")}
      >
        Medium
      </div>

      {/* Search */}
      {onSearch && (
        <input
          placeholder="Search blogs..."
          className="border rounded-full px-4 py-1.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-green-400"
          onChange={(e) => onSearch(e.target.value)}
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/publish")}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-full text-sm"
        >
          + Write
        </button>
        <button
          onClick={handleSignout}
          className="text-sm text-gray-500 hover:text-black"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};