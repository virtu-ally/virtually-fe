import { ReactNode, createContext, useContext, useState } from "react";

interface CustomerProfile {
  auth0Id: string;
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

const CustomerContext = createContext<CustomerContextType>({
  profile: null,
  setProfile: () => {},
  addGoal: () => {},
});

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const addGoal = (goal: NonNullable<CustomerProfile["goals"]>[number]) => {
    setProfile((prev) => {
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

export const useCustomer = () => useContext(CustomerContext);
