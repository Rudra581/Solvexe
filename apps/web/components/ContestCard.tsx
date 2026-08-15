import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@repo/ui/card";
import Link from "next/link";
import { parseFutureDate, parseOldDate } from "../app/lib/time";
import { PrimaryButton } from "./LinkButton";

interface ContestCardParams {
  title: string;
  id: string;
  endTime: Date;
  startTime: Date;
}

export function ContestCard({
  title,
  id,
  startTime,
  endTime,
}: ContestCardParams) {
  const durationHours = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60));
  const duration = `${durationHours} hours`;
  const isActive =
    startTime.getTime() < Date.now() && endTime.getTime() > Date.now();
  const isUpcoming = startTime.getTime() > Date.now();


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>{title}</CardTitle>
          <div>
            {isActive ? (
              <div className="text-green-500 font-semibold">Active</div>
            ) : endTime.getTime() < Date.now() ? (
              <div className="text-red-500 font-semibold">Ended</div>
            ) : (
              <div className="text-blue-500 font-semibold">Upcoming</div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400">
              {startTime.getTime() < Date.now() ? "Started" : "Starts in"}
            </p>
            <p>
              {startTime.getTime() < Date.now()
                ? parseOldDate(new Date(startTime))
                : parseFutureDate(new Date(startTime))}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Duration</p>
            <p>{duration}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {isUpcoming ? (
          <button
            disabled
            className="w-full inline-flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed"
          >
            Starts Soon
          </button>
        ) : (
          <PrimaryButton href={`/contest/${id}`}>
            {isActive ? "Participate" : "View Contest"}
          </PrimaryButton>
        )}
      </CardFooter>
    </Card>
  );
}

