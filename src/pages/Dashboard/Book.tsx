import { MoveLeft, MoveRight } from "lucide-react";

const Book = ({ isBookOpen, setIsBookOpen }) => {
  const handleButtonClick = () => {
    setIsBookOpen(!isBookOpen);
  };

  return (
    <>
      {/* {isBookOpen && <p>list</p>} */}

      <div className={`bookContainer ${isBookOpen ? "clicked" : ""}`}>
        {isBookOpen ? (
          <button
            className="btn-primary cursor-pointer close "
            onClick={handleButtonClick}
          >
            <MoveRight
              color="var(--primary-color-red)"
              size={48}
              strokeWidth={1}
            />{" "}
            <span className="relative bottom-4 text-[var(--primary-color-red)] font-bold">
              Close
            </span>
          </button>
        ) : null}
        <div className={`book ${isBookOpen ? "clicked lg:translateY(0)" : ""}`}>
          {!isBookOpen ? (
            <button
              className="btn-primary cursor-pointer"
              onClick={handleButtonClick}
            >
              <MoveLeft
                color="var(--primary-color-red)"
                size={48}
                strokeWidth={1}
              />{" "}
              <span className="relative bottom-4 text-[var(--primary-color-red)] font-bold">
                Open
              </span>
            </button>
          ) : null}
          <div className="back"></div>
          {/* {isBookOpen && (
            <p
              className="absolute z-30 text-lg text-black"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              list
            </p>
          )} */}
          <div className="page6" style={{ zIndex: 1 }}></div>
          <div className="page5" style={{ zIndex: 1 }}></div>
          <div className="page4" style={{ zIndex: 1 }}></div>
          <div className="page3" style={{ zIndex: 1 }}></div>
          <div className="page2" style={{ zIndex: 1 }}></div>
          <div className="page1" style={{ zIndex: 1 }}></div>
          <div className="front" style={{ zIndex: 1 }}></div>
        </div>
      </div>
    </>
  );
};

export default Book;
