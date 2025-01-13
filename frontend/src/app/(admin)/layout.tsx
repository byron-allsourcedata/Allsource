"use client";
import React, { ReactNode } from "react";
import { Grid } from "@mui/material";
import Header from "@/components/Header";
import AdminSidebar from "@/components/SidebarAdmin";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <>
      <Header NewRequestNotification={false} />
      <Grid container sx={{ display: "flex", flexWrap: "nowrap", overflowX: "hidden", paddingTop: "4.25rem" }}>
        <Grid item xs={12} md="auto" lg="auto" sx={{ position: "fixed", flexBasis: "200px", overflowX: "hidden", flexShrink: 0, minWidth: "200px" }}>
          <AdminSidebar />
        </Grid>
        <Grid item xs={12} md lg sx={{ padding: "0px", ml:20 }}>
          {children}
        </Grid>
      </Grid>
    </>
  );
};

export default AdminLayout;
