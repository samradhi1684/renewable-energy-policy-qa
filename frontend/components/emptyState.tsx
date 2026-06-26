"use client";

interface EmptyStateProps {
  selectedModel: string;
  onQuestionClick: (
    question: string
  ) => void;
}

export default function EmptyState({
  selectedModel,
  onQuestionClick,
}: EmptyStateProps) {

  const questionSets = {
    mnre: [
      "What are India's current solar energy subsidies?",
      "India's National Green Hydrogen Mission explained",
      "EV charging incentives in India",
      "Solar rooftop subsidy schemes in 2026",
    ],

    dsire: [
      "Explain Inflation Reduction Act key provisions",
      "Federal EV tax credit eligibility",
      "US renewable energy grant programs",
      "Compare solar incentives across US states",
    ],
  };

  const questions =
    questionSets[
      selectedModel as keyof typeof questionSets
    ] || questionSets.mnre;

  const isIndia =
    selectedModel === "mnre";

  return (
    <div className="w-full h-full flex items-center justify-center px-8">

      {/* MAIN CONTAINER */}
      {/* <div className="w-full max-w-6xl flex flex-col items-center"> */}
      <div className="w-full h-full flex flex-col items-center justify-center px-8 -mt-20">

        {/* small badge */}
        <div className="mb-5 px-4 py-1 rounded-full bg-indigo-50 border border-indigo-100">
          <span className="text-indigo-600 text-sm font-medium">
            Renewable Policy Assistant
          </span>
        </div>

        {/* heading */}
        <h1 className="text-5xl font-bold text-gray-900 mb-4 text-center tracking-tight">
          What would you like to explore today?
        </h1>

        <p className="text-gray-500 text-lg text-center max-w-2xl leading-8 mb-14">
          Explore renewable energy policies, sustainability incentives,
          climate regulations, and clean energy programs.
        </p>

        {/* cards */}
        <div className="grid grid-cols-2 gap-7 w-full max-w-5xl">

          {questions.map(
            (
              question,
              index
            ) => (
              <button
                key={index}
                onClick={() =>
                  onQuestionClick(
                    question
                  )
                }
                className="
                  group
                  bg-white
                  border
                  border-gray-200
                  rounded-3xl
                  p-7
                  min-h-[170px]
                  text-left
                  transition-all
                  duration-300
                  hover:shadow-xl
                  hover:border-indigo-200
                  hover:-translate-y-1
                  relative
                  overflow-hidden
                "
              >

                {/* top accent */}
                <div
                  className={`
                    absolute top-0 left-0 h-2 w-full
                    ${
                      isIndia
                        ? "bg-green-500"
                        : "bg-indigo-600"
                    }
                  `}
                />

                {/* badge */}
                <div
                  className={`
                    inline-flex px-3 py-1 rounded-full text-xs
                    font-semibold text-white mb-6
                    ${
                      isIndia
                        ? "bg-green-500"
                        : "bg-indigo-600"
                    }
                  `}
                >
                  {isIndia
                    ? "India"
                    : "USA"}
                </div>

                {/* question */}
                <p className="text-gray-800 font-medium text-[17px] leading-7 pr-10">
                  {question}
                </p>

                {/* arrow */}
                <div className="absolute bottom-6 right-6 text-gray-300 text-2xl group-hover:text-indigo-600 transition">
                  →
                </div>
              </button>
            )
          )}
        </div>

        {/* helper */}
        <p className="mt-10 text-gray-400 text-sm">
          Click a suggestion to begin instantly
        </p>
      </div>
    </div>
  );
}