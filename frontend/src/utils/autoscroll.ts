const scrollToBlock = (blockRef: React.RefObject<HTMLDivElement>) => {
    if (blockRef.current) {
        blockRef.current.scrollIntoView({ behavior: "smooth" });
    }
};

export default scrollToBlock