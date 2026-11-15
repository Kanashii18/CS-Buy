"use client";

import { useState } from "react";

export default function PasswordInput({
     id,
     text,
     value,
     onChange,
     showPassword: controlledShowPassword,
     onTogglePassword,
}) {
     const [internalShow, setInternalShow] = useState(false);

     const isControlled = typeof controlledShowPassword === "boolean";
     const showPassword = isControlled ? controlledShowPassword : internalShow;

     const handleToggle = () => {
          if (onTogglePassword) {
               onTogglePassword();
          } else {
               setInternalShow((prev) => !prev);
          }
     };

     return (
          <div className="whitespace-nowrap relative w-full max-w-[400px] text-white">
               <input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    required
                    placeholder=" "
                    className="
          peer
          w-full
          bg-transparent
          text-center
          text-[1.17rem]
          outline-none
          border-b-2
          border-neutral-500
          pt-2
          pb-1
          px-8
          transition-colors
          focus:border-purple-600
        "
               />

               <label
                    htmlFor={id}
                    className="
          absolute
          left-1/2
          -translate-x-1/2
          bottom-[0.2em]
          text-[1.17rem]
          text-neutral-400
          pointer-events-none
          transition-all
          peer-focus:bottom-[1.8em]
          peer-focus:opacity-100
          peer-placeholder-shown:opacity-100
          peer-not-placeholder-shown:opacity-0
        "
               >
                    {text}
               </label>

               {/* Toggle visibility button */}
               <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleToggle}
                    className="
          absolute
          right-1
          bottom-1.5
          p-1
          text-neutral-400
          hover:text-white
          transition-colors
          focus:outline-none
        "
                    aria-label={
                         showPassword ? "Hide password" : "Show password"
                    }
               >
                    {showPassword ? (
                         /* Ojo tachado (Visible -> Clic para ocultar) */
                         <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.8}
                              stroke="currentColor"
                              className="w-5 h-5"
                         >
                              <path
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                                   d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                              />
                         </svg>
                    ) : (
                         /* Ojo abierto (Oculto -> Clic para mostrar) */
                         <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.8}
                              stroke="currentColor"
                              className="w-5 h-5"
                         >
                              <path
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                                   d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                              />
                              <path
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                                   d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                              />
                         </svg>
                    )}
               </button>
          </div>
     );
}
