"use client";

import styles from "@/styles/MobileSidebar.module.css";
import UserList from "./UserList";
import SignOut from "./SignOut";
import { useEffect, useState } from "react";

export default function MobileSidebar({
  currentUserName,
  currentUserId,
}: {
  currentUserName: string;
  currentUserId: string;
}) {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    function clickHandler() {
      setSidebarVisible(false);
    }

    window.addEventListener("click", clickHandler);

    return () => window.removeEventListener("click", clickHandler);
  }, []);

  return (
    <>
      <div
        className={`${styles.hamburgerWrapper} glass-window`}
        onClick={(e) => {
          setSidebarVisible(!sidebarVisible);
          e.stopPropagation();
        }}
      >
        <div className={styles.hamburger}></div>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${styles.mobileSidebar} ${sidebarVisible ? styles.visible : ""}`}
      >
        <SignOut name={currentUserName || "Guest"} userId={currentUserId} />
        <UserList currentUserId={currentUserId} />
      </div>
    </>
  );
}
