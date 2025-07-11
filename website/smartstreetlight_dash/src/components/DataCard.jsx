"use client";

import { ResponsiveLine } from "@nivo/line";
import { useState } from "react";
import { FetchData } from "@/lib/clientData";
import { useSearchParams } from "next/navigation";

// Card for energy and power graphs
export default function DataCard({ energy }) {
  const searchParams = useSearchParams();

  const id = searchParams.get("id");

  const { data: rawData, error, isLoading } = FetchData(id);

  // uncomment when pi is not connected
  // const rawData = testData;
  // const error = false;

  const [filter, setFilter] = useState("tdy");

  // dates for filtering by comparing data to these
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const lastMonth = new Date(startOfToday);
  lastMonth.setDate(lastMonth.getDate() - 31);
  const ytd = new Date(new Date().getFullYear(), 0, 1);
  const oneYear = new Date(startOfToday);
  oneYear.setDate(oneYear.getDate() - 365);

  if (error) return <div>Failed to load</div>; // TODO: change this to rawData = []
  if (!rawData) return <div>Loading...</div>; // [] evaluates to true in js

  const data = rawData.flatMap((obj, idx) => {
    // used for date comparisons, current obj.date set to 00:00:00
    const objDateTemp = new Date(obj.reading_time);
    objDateTemp.setHours(0, 0, 0, 0);

    const yData = energy ? obj.energy_usage : obj.power_consumption;

    switch (filter) {
      case "tdy":
        if (objDateTemp.getTime() === startOfToday.getTime()) {
          return {
            x: new Date(obj.reading_time), // converts UTC to locale time
            y: yData,
          };
        }
        return [];
      case "1M":
        if (objDateTemp >= lastMonth && objDateTemp <= startOfToday) {
          return {
            x: new Date(obj.reading_time),
            y: yData,
          };
        }
        return [];
      case "ytd":
        if (objDateTemp >= ytd && objDateTemp <= startOfToday) {
          return {
            x: new Date(obj.reading_time),
            y: yData,
          };
        }
        return [];

      case "1Y":
        if (objDateTemp >= oneYear && objDateTemp <= startOfToday) {
          return {
            x: new Date(obj.reading_time),
            y: yData,
          };
        }
        return [];

      default:
        return {
          x: new Date(obj.reading_time),
          y: yData,
        };
    }
  });

  const graphData = [
    {
      id: energy ? "energy" : "power",
      data: data,
    },
  ];

  console.log(graphData);

  function min() {
    switch (filter) {
      case "tdy":
        return startOfToday;
      case "1M":
        return lastMonth;
      case "ytd":
        return ytd;
      case "1Y":
        return oneYear;
      default:
        return "auto";
    }
  }

  function max() {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 59);

    const todayCurrentTime = new Date();

    if (filter === "tdy") {
      return endOfToday;
    }

    return todayCurrentTime;
  }

  function tickVals() {
    switch (filter) {
      case "tdy":
        return "every 4 hours";
      case "1M":
        return "every 3 days";
      case "max":
        return "every year";
      default:
        return "every month";
    }
  }

  function format() {
    switch (filter) {
      case "tdy":
        return "%H:%M";
      case "1M":
        return "%b-%d";
      case "max":
        return "%Y";

      default:
        return "%Y-%b";
    }
  }

  const filterOptions = [
    { key: "tdy", label: "Today" },
    { key: "1M", label: "1 Month" },
    { key: "ytd", label: "YTD" },
    { key: "1Y", label: "1 Year" },
    { key: "max", label: "Max" },
  ];

  // console.log("rerender from", energy ? "energy" : "power", graphData); // for detecting rerenders

  return (
    <div className="flex h-2/5 text-center rounded-md shadow-sm items-stretch gap-4 bg-boxes">
      {/* Filter Box */}
      <section className="flex flex-col items-center gap-y-4 w-1/5 min-w-[300px] p-4 rounded-md overflow-hidden flex-none">
        <h2 className="text-xl">{energy ? "Energy" : "Power"} Usage</h2>
        <div className="flex flex-col gap-2 justify-center w-full">
          {filterOptions.map((option) => (
            <label key={option.key} className="cursor-pointer w-full">
              <input
                type="radio"
                name={`${energy}filter`}
                className="hidden peer"
                onClick={() => setFilter(option.key)}
              />
              <span className="block w-full py-2 text-sm text-center rounded-full outline outline-1 peer-checked:bg-blue">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Graph Box */}
      <div className="relative flex-grow bg-boxes p-2 rounded-md min-h-[300px] max-w-full">
        <div className=" flex overflow-visible h-full w-full">
          {data.length > 0 ? (
            <ResponsiveLine
              tooltip={({ point }) => {
                return (
                  <div className="p-2 rounded-md shadow-md bg-background">
                    <div className="font-bold mb-1">
                      {new Date(point.data.xFormatted).toLocaleString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                    <div>{point.data.yFormatted}</div>
                  </div>
                );
              }}
              data={graphData}
              margin={{ top: 20, right: 50, bottom: 30, left: 50 }}
              xScale={{
                type: "time",
                min: min(),
                max: max(),
                precision: "second",
                useUTC: false,
              }}
              axisBottom={{
                orient: "bottom",
                // tickPadding: 10,
                tickValues: tickVals(),
                format: format(),
                translateX: 25,
              }}
              yScale={{
                type: "linear",
                min: "0",
                max: "auto",
              }}
              axisLeft={{
                tickValues: 4,
                legend: energy ? "Energy (kWh)" : "Power (W)",
                legendOffset: -45,
                legendPosition: "middle",
              }}
              enableGridX={false}
              crosshairType="x"
              curve={"linear"}
              pointLabelYOffset={-12}
              pointSize={5}
              enableTouchCrosshair={true}
              useMesh={true}
            />
          ) : (
            <div className="m-auto">
              <h1>No data for filter option</h1>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
