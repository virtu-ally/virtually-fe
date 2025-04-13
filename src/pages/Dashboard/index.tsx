import "./index.css";

import { MoveLeft, MoveRight } from "lucide-react";

import { useState } from "react";

const Dashboard = () => {
  const [isClicked, setIsClicked] = useState(false);

  const handleButtonClick = () => {
    setIsClicked(!isClicked);
  };

  return (
    <>
      <div className="text-center">
        <h1 className="text-5xl pt-12">Your Story</h1>
      </div>
      <div className={`bookContainer ${isClicked ? "clicked" : ""}`}>
        {isClicked ? (
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
        <div className={`book ${isClicked ? "clicked" : ""}`}>
          {!isClicked ? (
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
          <div className="page6"></div>
          <div className="page5"></div>
          <div className="page4"></div>
          <div className="page3"></div>
          <div className="page2"></div>
          <div className="page1"></div>
          <div className="front"></div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
