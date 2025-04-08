export const getStatusStyle = (status: string) => {
    switch (status) {
        case 'Synced':
            return {
                background: 'rgba(234, 248, 221, 1)',
                color: 'rgba(43, 91, 0, 1)',
            };
        case 'Unvalidated':
            return {
                background: 'rgba(236, 236, 236, 1)',
                color: 'rgba(74, 74, 74, 1)',
            };
        case 'Ready':
            return {
                background: 'rgba(254, 243, 205, 1)',
                color: 'rgba(179, 151, 9, 1)',
            };
        case 'Validating':
            return {
                background: 'rgba(0, 129, 251, 0.2)',
                color: 'rgba(0, 129, 251, 1)',
            };
        case 'Data Syncing':
            return {
                background: 'rgba(0, 129, 251, 0.2)',
                color: 'rgba(0, 129, 251, 1)',
            };
        default:
            return {
                background: 'transparent',
                color: 'inherit',
            };
    }
};