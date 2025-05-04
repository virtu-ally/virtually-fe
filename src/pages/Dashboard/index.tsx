import "./index.css";

import { Link, useNavigate } from "react-router-dom";

import Book from "./Book";
import { CheckCheck } from "lucide-react";
import { useState } from "react";

const Dashboard = () => {
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isNavigateClicked, setIsNavigateClicked] = useState(false);
  const [goal, setGoal] = useState("");
  const navigate = useNavigate();

  const handleNavigate = (e) => {
    setIsNavigateClicked(true);
    e.preventDefault();
    setTimeout(() => {
      navigate("/template", { state: { goal } });
    }, 1500);
  };

  const handleChange = (e) => {
    setGoal(e.target.value);
  };

  return (
    <>
      <div className={`text-center `}>
        <h1
          className={`text-5xl pt-12 " ${
            isNavigateClicked ? "fadeOutTitle-delayed" : ""
          }`}
        >
          Your Story
        </h1>
      </div>
      <div className={`flex flex-col text-center`}>
        {isBookOpen && (
          <div
            className={`relative top-[85px] z-[2] h-[0] left-[-1.5rem] animation-delay-1000 fade-in  
            ${isNavigateClicked ? "fadeOutContent-delayed" : ""}
            `}
          >
            <div
              className={`animation-delay-1000 fade-in    ${
                isNavigateClicked ? "fadeOutContent-delayed2" : ""
              }`}
            >
              <CheckCheck className="inline-flex align-middle" />
              <input
                type="text"
                id="task1"
                className="input text-black"
                placeholder="Find a fun site"
                value="Find a fun site"
                disabled
              />
            </div>
            <div
              className={`animation-delay-1000 fade-in    ${
                isNavigateClicked ? "fadeOutContent-delayed2" : ""
              }`}
            >
              {/* <span className="text-gray-600">&#9634;</span> */}
              <input
                type="text"
                id="task2"
                className="input"
                placeholder="Type Goal 2..."
                onChange={handleChange}
              />
            </div>
            {/* <div className="fade-in">
              <span className="text-gray-600">&#9634;</span>
              <input
                type="text"
                id="task3"
                className="input"
                placeholder="Input Goal 3..."
              />
            </div>
            <div className="fade-in">
              <span className="text-gray-600">&#9634;</span>
              <input
                type="text"
                id="task4"
                className="input"
                placeholder="Input Goal 4..."
              />
            </div> */}
            <div className="fade-in my-4">
              <Link
                to="/template"
                viewTransition
                onClick={handleNavigate}
                className="submit-button "
              >
                Create plan
              </Link>
            </div>

            <div
              className={`max-w-[230px] inline-block pt-4 fade-in ${
                isNavigateClicked ? "fadeOutContent-delayed" : ""
              }`}
            >
              <p>What are your goals? </p>
              <br />
              <ul className="pt-4">
                <li> Would you like to become healthy,</li>
                <li> more knowledgable about plants </li>
                <li>or determined to read an hour every day?</li>
              </ul>
            </div>
          </div>
        )}
        <Book
          isBookOpen={isBookOpen}
          setIsBookOpen={setIsBookOpen}
          isNavigateClicked={isNavigateClicked}
        />
      </div>
    </>
  );
};

export default Dashboard;
