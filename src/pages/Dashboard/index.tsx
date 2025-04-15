import "./index.css";

import Book from "./Book";
import { CheckCheck } from "lucide-react";
import { useState } from "react";

const Dashboard = () => {
  const [isBookOpen, setIsBookOpen] = useState(false);

  return (
    <>
      <div className="text-center">
        <h1 className="text-5xl pt-12">Your Story</h1>
      </div>
      <div className="flex flex-col text-center">
        {isBookOpen && (
          <div className="relative top-[100px] z-[2] h-[0] left-[0.8rem]">
            <div className="inputContainer">
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
            <div className="inputContainer">
              <span className="text-gray-600">&#9634;</span>
              <input
                type="text"
                id="task2"
                className="input"
                placeholder="Input Goal 2"
              />
            </div>
            <div className="inputContainer">
              <span className="text-gray-600">&#9634;</span>
              <input
                type="text"
                id="task3"
                className="input"
                placeholder="Input Goal 3"
              />
            </div>
            <div className="inputContainer">
              <span className="text-gray-600">&#9634;</span>
              <input
                type="text"
                id="task4"
                className="input"
                placeholder="Input Goal 4"
              />
            </div>
          </div>
        )}
        <Book isBookOpen={isBookOpen} setIsBookOpen={setIsBookOpen} />
      </div>
    </>
  );
};

export default Dashboard;
