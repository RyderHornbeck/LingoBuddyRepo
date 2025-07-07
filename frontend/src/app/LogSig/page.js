"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../globals.css";
export default function LogSig() {
    
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(true);
  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  function handleChange(e){
    const { name, value} = e.target;
    setUser((prev) => ({
        ...prev, [name]: value,
    }));
  }
  useEffect(() => {
    setUser({email: "", password: ""});
  },[isSignUp]);

  const handleSignup = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("users")) || [];
     if (users.find(u => u.email === user.email)) {
    alert("User already exists!");
    setUser({email: "", password: ""});
    return;
  }

  users.push({email: user.email ,password: user.password });


  localStorage.setItem("users", JSON.stringify(users));

  localStorage.setItem("loggedInUser", user.email);

    router.replace("/");

  } 
  const handleLogin = (e) => {
  e.preventDefault();
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const matchedUser = users.find(u => u.email === user.email && u.password === user.password);

  if (matchedUser) {
    localStorage.setItem("loggedInUser", user.email);
    router.replace("/");
  } else {
    alert("Invalid credentials");
    setUser({email: "", password: ""});
  }
};
  return (
    <div className="flex justify-center items-center w-full h-full">
    <div
      className=" relative flex justify-center items-center border-.5 border-black w-1/2 h-1/2
    "
    >
      <div className="border-2 border-black w-full h-full flex flex-col items-center justify-center">
        <form className="flex flex-col space-y-2 ">
        <label>Email:</label>
          <input onChange={handleChange} type="email" name = "email" value = {user.email} className="focus:ring-2 focus:outline-none p-4  my-4 border-1 rounded-2xl" placeholder="youremail@.com" required/>
          <label>Password</label>
           <input onChange = {handleChange} type = "password" name="password" value = {user.password} className="focus:ring-2 focus:outline-none p-4 my-4 border-1 rounded-2xl" placeholder="........." required/>
          <button type = "button" className="p-2 bg-black text-white rounded-4xl m-2" onClick={handleLogin}>Login</button>
        </form>
      </div>
      <div className="border-2 border-black w-full h-full flex flex-col items-center justify-center">
        <form className="flex flex-col tex-base ">
            <label>Email:</label>
          <input onChange={handleChange} type="email" name = "email"  value = {user.email} className="focus:ring-2 focus:outline-none p-4  my-4 border-1 rounded-2xl" placeholder="youremail@.com" required/>
          <label>Password</label>
           <input onChange = {handleChange} type = "password" name="password" value = {user.password} className="focus:ring-2 focus:outline-none p-4 my-4 border-1 rounded-2xl" placeholder="........." required/>
          <button type="button" className="p-2 bg-black text-white rounded-4xl m-2" onClick = {handleSignup}>Sign Up</button>
        </form>
      </div>
      <div className={`absolute z-10 inset-0 bg-gradient-to-r from-blue-500 to-red-500 w-1/2 h-full flex flex-col 
         items-center transition-transform duration-1000 ${isSignUp ? "translate-x-0" : "translate-x-full"} border-2 border-black `}>
        {isSignUp ? (
            <>
            <h2 className="sm:text-xl lg:text-3xl text-center mt-5">Sign Up to begin your language journery with Lingo Buddy</h2>
            <img src = "/defaultTC.png" className="sm:h-48 lg:h-72"></img>
            <p> Already have an account<span> </span>
          <button
          className="underline"
            onClick={() => {
              setIsSignUp(false);
            }}
          > 
             Login here
          </button> </p>
          </>
        ) : (
<>  
            <h2 className="text-3xl text-center mt-5">Login to continue your language journey with Lingo Buddy</h2>
            <img src = "/defaultTC.png" className="h-72"></img>
            <p>Don't have an account<span> </span>
          <button
          className="underline"
            onClick={() => {
              setIsSignUp(true);
            }}
          > 
             Sign Up here
          </button> </p>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
