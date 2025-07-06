import React, { ReactNode, createContext, useContext, useState } from "react";

interface CustomerProfile {
  firebaseId: string;
  name: string;
  email: string;
  customerId: string;
  goals?: {
    id: string;
    description: string;
    timeframe: string;
    habits: string[];
  }[];
}

interface CustomerContextType {
  profile: CustomerProfile | null;
  setProfile: (profile: CustomerProfile) => void;
  addGoal: (goal: NonNullable<CustomerProfile["goals"]>[number]) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined
);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Load profile from sessionStorage on initialization
  const [profile, setProfileState] = useState<CustomerProfile | null>(() => {
    const savedProfile = sessionStorage.getItem("customerProfile");
    return savedProfile ? JSON.parse(savedProfile) : null;
  });

  const setProfile = (newProfile: CustomerProfile) => {
    setProfileState(newProfile);
    // Save to sessionStorage whenever profile is updated
    sessionStorage.setItem("customerProfile", JSON.stringify(newProfile));
  };

  const addGoal = (goal: NonNullable<CustomerProfile["goals"]>[number]) => {
    setProfileState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        goals: [...(prev.goals || []), goal],
      };
    });
  };

  return (
    <CustomerContext.Provider value={{ profile, setProfile, addGoal }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
};
