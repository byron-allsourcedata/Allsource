const ThreeDotsLoader = () => {
  return (
    <div className="dots-loader">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
      <style jsx>{`
        .dots-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        @media {max-width: 600px}: {
          .dots-loader {
            justify-content: flex-start;
          }
        }

        .dot {
          width: 4px;
          height: 4px;
          background-color: rgba(217, 217, 217, 1);
          border-radius: 5px;
          animation: dot-blink 1.2s infinite ease-out;
        }

        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes dot-blink {
          0%, 100% {
            background-color: rgba(217, 217, 217, 1)
          }
          50% {
            background-color: rgba(45, 45, 45, 1)
          }
        }
      `}</style>
    </div>
  );
};

export default ThreeDotsLoader;
