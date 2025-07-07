import React from "react";
import { FaPencilAlt, FaRegEdit } from "react-icons/fa";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { useRouter } from "next/navigation";
export default function SideBar({
  isOpen,
  setIsOpen,
  newChat,
  convoTitles,
  conversations,
  convoNumber,
  selectChat,
  editConvo,
  setEditConvo,
  setConvoTitles,
}){
  const router = useRouter();
const handleLogout = () => {
  localStorage.removeItem("loggedInUser");
  router.replace("/LogSig");
};
  return (
    <div>
      <div
        className={`h-full ${
          isOpen ? "w-96" : "w-0"
        } bg-white border-r border-black shadow-lg flex flex-col items-center overflow-hidden transition-all duration-300 ease-in-out`}
      >
        <form onSubmit={newChat}>
          <button className="m-2 p-2 rounded-xl bg-gray-200 hover:bg-gray-400 text-md w-fit h-fit flex justify-center">
            <FaPencilAlt size={24} className="mr-2" />
            new chat
          </button>
        </form>

        {convoTitles.slice().reverse().map((chat, index) => {
          const originalIndex = conversations.length - 1 - index;

          return editConvo === originalIndex ? (
            <div key={originalIndex} className="m-2 px-4 py-2 w-4/5">
              <input
                className="w-full border rounded px-2 py-1"
                defaultValue={`Chat ${originalIndex + 1}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setEditConvo(false);
                    setConvoTitles((prev) => {
                      const updated = [...prev];
                      updated[originalIndex] = e.target.value;
                      return updated;
                    });
                  }
                }}
              />
            </div>
          ) : (
            <div
              key={originalIndex}
              className="flex items-center justify-between w-4/5 m-2"
            >
              <button
                onClick={() => selectChat(originalIndex)}
                className={`flex-1 text-left px-4 py-2 rounded-md transition-colors ${
                  originalIndex === convoNumber
                    ? "bg-gray-400 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {convoTitles[originalIndex]}
              </button>
              <button
                onClick={() => setEditConvo(originalIndex)}
                className="ml-2 text-gray-700 hover:text-black"
              >
                <FaRegEdit size={20} />
              </button>
            </div>
          );
        })}
        <button className="m-2 p-2 rounded-xl bg-gray-200 hover:bg-gray-400 text-md w-fit h-fit flex justify-center" type = "button" onClick = {handleLogout}>Logout</button>
      </div>
    </div>
  );
}
