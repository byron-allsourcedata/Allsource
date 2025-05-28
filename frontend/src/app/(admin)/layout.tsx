"use client";
import React, { ReactNode } from "react";
import { Grid } from "@mui/material";
import HeaderAdmin from "./HeaderAdmin";
import AdminSidebar from "./SidebarAdmin";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <>
      <HeaderAdmin NewRequestNotification={false} />
      <Grid container sx={{ display: "flex", flexWrap: "nowrap", overflowX: "hidden", paddingTop: "4.25rem" }}> 
        <Grid item xs={12} md="auto" lg="auto" sx={{ position: "fixed", flexBasis: "168px", overflowX: "hidden", flexShrink: 0, display: { xs: 'none', md: 'block' }, }}>
          <AdminSidebar />
        </Grid>
        <Grid item xs={12} md lg sx={{ padding: "0px", ml:20, '@media (max-width: 899px)': {
              padding: '0 16px 32px',
              marginLeft: 0,
            },
            '@media (max-width: 599px)': {
              padding: '0 16px 16px',
              marginLeft: 0,
            } }}>
          {children}
        </Grid>
      </Grid>
    </>
  );
};

export default AdminLayout;
