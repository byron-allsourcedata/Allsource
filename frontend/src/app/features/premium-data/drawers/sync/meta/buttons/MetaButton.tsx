import { Button, styled } from "@mui/material";

export const MetaButton = styled(Button)`
border-radius: 4px;
border: 1px solid rgba(56, 152, 252, 1);
background: #fff;
box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.25);
font-family: var(--font-nunito);
font-size: 14px;
font-weight: 600;
line-height: 20px;
color: rgba(56, 152, 252, 1);
text-transform: none;
padding: 4px 22px;
&:hover {
    background: transparent;
}
&.Mui-disabled {
    background-color: #e4e4e4;
    color: #808080;
}
`;
