import React, { createContext, useContext, useState, useEffect } from "react";
import { setGroupId } from "@workspace/api-client-react";

interface GroupContextValue {
  groupId: number | null;
  groupName: string | null;
  setGroup: (id: number, name: string) => void;
  clearGroup: () => void;
}

const GroupContext = createContext<GroupContextValue>({
  groupId: null,
  groupName: null,
  setGroup: () => {},
  clearGroup: () => {},
});

export function useGroup() {
  return useContext(GroupContext);
}

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groupId, setGroupIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem("groupId");
    return stored ? Number(stored) : null;
  });

  const [groupName, setGroupName] = useState<string | null>(() => {
    return localStorage.getItem("groupName");
  });

  useEffect(() => {
    setGroupId(groupId);
  }, [groupId]);

  function setGroup(id: number, name: string) {
    localStorage.setItem("groupId", String(id));
    localStorage.setItem("groupName", name);
    setGroupIdState(id);
    setGroupName(name);
    setGroupId(id);
  }

  function clearGroup() {
    localStorage.removeItem("groupId");
    localStorage.removeItem("groupName");
    setGroupIdState(null);
    setGroupName(null);
    setGroupId(null);
  }

  return (
    <GroupContext.Provider value={{ groupId, groupName, setGroup, clearGroup }}>
      {children}
    </GroupContext.Provider>
  );
}
