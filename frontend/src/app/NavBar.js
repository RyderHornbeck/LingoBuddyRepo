import React from "react";

export default function NavBar(props){
    return  <nav className="flex justify-between items-center p-4 h-1/10 bg-gray-100 border-b-2 border-black relative z-20">
        <div className="font-bold text-xl flex items-center gap-3 bg-black rounded-2xl text-white px-2 py-1">
          <img
            src={`/${props.nativeflagSrc}`}
            className="h-12"
            alt="Native language flag"
          />
          Lingo Buddy
          <img
            src={`/${props.learnflagSrc}`}
            className="h-12"
            alt="Learning language flag"
          />
        </div>
      </nav>
}