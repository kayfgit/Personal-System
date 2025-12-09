import { Check, Clock, Info, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  AppState,
  AppStateStatus,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/theme";

export type QuestGoal = {
  exercise: string;
  id?: string;
  current: number;
  target: number;
  unit?: string;
};

type QuestInfoProps = {
  title: string;
  goals: QuestGoal[];
  onGoalPress?: (goal: QuestGoal, index: number) => void;
  onCompleteQuest: () => void;
  onUncompleteQuest?: () => void;
  isCompleted: boolean;
};

const QuestInfo: React.FC<QuestInfoProps> = ({
  title,
  goals,
  onGoalPress,
  onCompleteQuest,
  onUncompleteQuest,
  isCompleted,
}) => {
  const { theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [clockColor, setClockColor] = useState(theme.primary);
  const [showTimer, setShowTimer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  const allGoalsComplete = goals.every((goal) => goal.current >= goal.target);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (showTimer) {
      const updateTimer = () => {
        const now = new Date();
        const midnight = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
          0,
          0,
          0
        );
        const diff = midnight.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeRemaining(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      };

      updateTimer();
      //@ts-ignore
      interval = setInterval(updateTimer, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showTimer]);

  useEffect(() => {
    if (!allGoalsComplete) {
      const getGradientColor = (percentage: number) => {
        const green = { r: 34, g: 197, b: 94 };
        const yellow = { r: 250, g: 204, b: 21 };
        const orange = { r: 249, g: 115, b: 22 };
        const red = { r: 239, g: 68, b: 68 };

        let c1, c2, p;

        if (percentage < 1 / 3) {
          c1 = green;
          c2 = yellow;
          p = percentage * 3;
        } else if (percentage < 2 / 3) {
          c1 = yellow;
          c2 = orange;
          p = (percentage - 1 / 3) * 3;
        } else {
          c1 = orange;
          c2 = red;
          p = (percentage - 2 / 3) * 3;
        }

        const r = Math.round(c1.r * (1 - p) + c2.r * p);
        const g = Math.round(c1.g * (1 - p) + c2.g * p);
        const b = Math.round(c1.b * (1 - p) + c2.b * p);

        return `rgb(${r}, ${g}, ${b})`;
      };

      const updateColor = () => {
        const now = new Date();
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const secondsInDay = 24 * 60 * 60;
        const secondsPassed = (now.getTime() - startOfDay.getTime()) / 1000;
        const percentage = secondsPassed / secondsInDay;
        setClockColor(getGradientColor(percentage));
      };

      let interval: NodeJS.Timeout | null = null;

      const startTimer = () => {
        if (interval) clearInterval(interval);
        updateColor();
        //@ts-ignore
        interval = setInterval(updateColor, 60000);
      };

      const stopTimer = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };

      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          startTimer();
        } else {
          stopTimer();
        }
      };

      const subscription = AppState.addEventListener(
        "change",
        handleAppStateChange
      );

      startTimer(); // initial start

      return () => {
        subscription.remove();
        stopTimer();
      };
    }
  }, [allGoalsComplete]);
  return (
    <View
      style={{
        width: "100%",
        maxWidth: 448,
        backgroundColor: theme.panel,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: theme.primary,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.primary,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Info size={24} color={theme.primary} />
          <Text
            style={{
              color: theme["text-light"],
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            QUEST INFO
          </Text>
        </View>
        <TouchableOpacity onPress={onUncompleteQuest}>
          <X size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ padding: 16 }}>
        <Text
          style={{
            color: theme["text-light"],
            fontSize: 24,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {title}
        </Text>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              textAlign: "center",
              color: "#22c55e",
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 16,
            }}
          >
            GOALS
          </Text>
          {goals.map((goal, index) => {
            const isComplete = goal.current >= goal.target;
            return (
              <TouchableOpacity
                key={goal.id || index}
                onPress={() => {
                  if (isCompleted) return;
                  setSelectedIndex(index);
                  onGoalPress?.(goal, index);
                }}
                style={{
                  marginBottom: 12,
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor:
                    selectedIndex === index
                      ? theme.primary + "33"
                      : "transparent",
                  opacity: isCompleted ? 0.5 : 1,
                }}
                activeOpacity={0.7}
                disabled={isCompleted}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      color:
                        selectedIndex === index
                          ? theme["primary-lighter"]
                          : theme["text-light"],
                      fontWeight: selectedIndex === index ? "bold" : "normal",
                    }}
                  >
                    -{goal.exercise}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 18,
                        color:
                          selectedIndex === index
                            ? theme["primary-lighter"]
                            : theme["text-light"],
                        fontWeight: selectedIndex === index ? "bold" : "normal",
                      }}
                    >
                      [{goal.current}/{goal.target}
                      {goal.unit || ""}]
                    </Text>
                    {isComplete && (
                      <Check
                        size={20}
                        color="#22c55e"
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </View>
                </View>
                {selectedIndex === index && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderWidth: 1,
                      borderColor: theme["primary-light"],
                      borderRadius: 8,
                      shadowColor: theme.primary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {(!allGoalsComplete || allGoalsComplete) && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: theme["text-light"],
                fontSize: 18,
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  color: theme.danger,
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                CAUTION!{" "}
              </Text>
              - IF THE DAILY QUEST{"\n"}REMAINS INCOMPLETE, PENALTIES{"\n"}
              WILL BE GIVEN ACCORDINGLY.
            </Text>
          </View>
        )}

        {!allGoalsComplete && (
          <View style={{ alignItems: "center", marginTop: 16 }}>
            {showTimer && (
              <Text
                style={{
                  color: theme["text-light"],
                  fontSize: 20,
                  marginBottom: 8,
                }}
              >
                {timeRemaining}
              </Text>
            )}
            <TouchableOpacity onPress={() => setShowTimer((prev) => !prev)}>
              <Clock size={40} color={clockColor} />
            </TouchableOpacity>
          </View>
        )}

        {allGoalsComplete && (
          <View style={{ marginBottom: 24 }}>

            <Pressable
              onPress={onCompleteQuest}
              disabled={isCompleted}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.primary + "4D",
                backgroundColor: isCompleted
                  ? "#6b7280" + "B3"
                  : "#166534" + "B3",
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: 18,
                  color: isCompleted ? "#9ca3af" : "#22c55e",
                }}
              >
                {isCompleted ? "COMPLETED" : "COMPLETE QUEST"}
              </Text>
            </Pressable>

          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default QuestInfo;
