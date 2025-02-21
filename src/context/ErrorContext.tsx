import React, { createContext, useReducer, useContext, ReactNode } from "react";

// ✅ Define error state type
interface ErrorState {
  message: string | null;
}

// ✅ Define actions
type Action = { type: "SET_ERROR"; payload: string } | { type: "CLEAR_ERROR" };

// ✅ Reducer function
const errorReducer = (state: ErrorState, action: Action): ErrorState => {
  switch (action.type) {
    case "SET_ERROR":
      return { message: action.payload };
    case "CLEAR_ERROR":
      return { message: null };
    default:
      return state;
  }
};

// ✅ Create Context
const ErrorContext = createContext<
  { state: ErrorState; dispatch: React.Dispatch<Action> } | undefined
>(undefined);

// ✅ Error Provider
export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, { message: null });

  return <ErrorContext.Provider value={{ state, dispatch }}>{children}</ErrorContext.Provider>;
};

// ✅ Custom Hook for using error state
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};
