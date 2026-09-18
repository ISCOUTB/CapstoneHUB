"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

const PARAM_NAME = "tab";

type ProjectTabsProps = {
  children: React.ReactNode;

  defaultTab: string;
 
  validTabs: string[];
  className?: string;
};

export default function ProjectTabs({
  children,
  defaultTab,
  validTabs,
  className,
}: ProjectTabsProps) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get(PARAM_NAME);

  const [activeTab, setActiveTab] = useState(() =>
    requestedTab && validTabs.includes(requestedTab)
      ? requestedTab
      : defaultTab,
  );

  function handleValueChange(nextValue: string) {
    setActiveTab(nextValue);

   
    const url = new URL(window.location.href);

    if (nextValue === defaultTab) {
      url.searchParams.delete(PARAM_NAME);
    } else {
      url.searchParams.set(PARAM_NAME, nextValue);
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => handleValueChange(String(value))}
      className={className}
    >
      {children}
    </Tabs>
  );
}
