import { useRouter } from "expo-router";
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Edit3,
    Plus,
    Ruler,
    Scale,
    TrendingDown,
    TrendingUp,
    X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../context/theme";
import { loadObject, saveObject } from "../../../lib/storage";

// Types
interface Measurement {
    value: number;
    date: string; // ISO date string
}

interface BodyStats {
    height: number | null; // in cm
    weightHistory: Measurement[];
    measurements: {
        chest: Measurement[];
        waist: Measurement[];
        hips: Measurement[];
        leftArm: Measurement[];
        rightArm: Measurement[];
        leftThigh: Measurement[];
        rightThigh: Measurement[];
    };
}

const STORAGE_KEY = "body-stats";

const defaultStats: BodyStats = {
    height: null,
    weightHistory: [],
    measurements: {
        chest: [],
        waist: [],
        hips: [],
        leftArm: [],
        rightArm: [],
        leftThigh: [],
        rightThigh: [],
    },
};

// Helper functions
const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const calculateBMI = (weightKg: number, heightCm: number): number => {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
};

const getBMICategory = (bmi: number): { label: string; color: string } => {
    if (bmi < 18.5) return { label: "Underweight", color: "#3b82f6" };
    if (bmi < 25) return { label: "Normal", color: "#22c55e" };
    if (bmi < 30) return { label: "Overweight", color: "#eab308" };
    return { label: "Obese", color: "#ef4444" };
};

const getTrend = (
    history: Measurement[]
): "up" | "down" | "stable" | null => {
    if (history.length < 2) return null;
    const sorted = [...history].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const diff = sorted[0].value - sorted[1].value;
    if (Math.abs(diff) < 0.1) return "stable";
    return diff > 0 ? "up" : "down";
};

// Components
const StatCard = ({
    label,
    value,
    unit,
    trend,
    onEdit,
    onAdd,
    icon,
    subtitle,
}: {
    label: string;
    value: string | number | null;
    unit: string;
    trend?: "up" | "down" | "stable" | null;
    onEdit?: () => void;
    onAdd?: () => void;
    icon: React.ReactNode;
    subtitle?: string;
}) => {
    const { theme } = useTheme();

    return (
        <View
            style={{
                backgroundColor: theme.panel + "CC",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.primary + "33",
                marginBottom: 12,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: theme.primary + "22",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {icon}
                    </View>
                    <View>
                        <Text style={{ color: theme.text, fontSize: 14 }}>{label}</Text>
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                            <Text
                                style={{
                                    color: theme["text-light"],
                                    fontSize: 24,
                                    fontWeight: "700",
                                }}
                            >
                                {value ?? "--"}
                            </Text>
                            <Text style={{ color: theme.text, fontSize: 14 }}>{unit}</Text>
                        </View>
                        {subtitle && (
                            <Text style={{ color: theme.text, fontSize: 12, marginTop: 2 }}>
                                {subtitle}
                            </Text>
                        )}
                    </View>
                </View>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    {trend && trend !== "stable" && (
                        <View
                            style={{
                                padding: 6,
                                borderRadius: 8,
                                backgroundColor:
                                    trend === "down"
                                        ? "#22c55e22"
                                        : "#ef444422",
                            }}
                        >
                            {trend === "up" ? (
                                <TrendingUp size={16} color="#ef4444" />
                            ) : (
                                <TrendingDown size={16} color="#22c55e" />
                            )}
                        </View>
                    )}
                    {onAdd && (
                        <Pressable
                            onPress={onAdd}
                            style={{
                                padding: 8,
                                borderRadius: 8,
                                backgroundColor: theme.primary + "22",
                            }}
                        >
                            <Plus size={18} color={theme.primary} />
                        </Pressable>
                    )}
                    {onEdit && (
                        <Pressable
                            onPress={onEdit}
                            style={{
                                padding: 8,
                                borderRadius: 8,
                                backgroundColor: theme.primary + "22",
                            }}
                        >
                            <Edit3 size={16} color={theme.primary} />
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
};

const MeasurementItem = ({
    label,
    measurements,
    onAdd,
}: {
    label: string;
    measurements: Measurement[];
    onAdd: () => void;
}) => {
    const { theme } = useTheme();
    const [expanded, setExpanded] = useState(false);
    const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;
    const trend = getTrend(measurements);

    return (
        <View
            style={{
                backgroundColor: theme.panel + "99",
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: theme.primary + "22",
                overflow: "hidden",
            }}
        >
            <Pressable
                onPress={() => measurements.length > 0 && setExpanded(!expanded)}
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 14,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Text style={{ color: theme["text-light"], fontSize: 16 }}>{label}</Text>
                    {trend && trend !== "stable" && (
                        <View
                            style={{
                                padding: 4,
                                borderRadius: 6,
                                backgroundColor:
                                    trend === "down" ? "#22c55e22" : "#ef444422",
                            }}
                        >
                            {trend === "up" ? (
                                <TrendingUp size={14} color="#ef4444" />
                            ) : (
                                <TrendingDown size={14} color="#22c55e" />
                            )}
                        </View>
                    )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Text style={{ color: theme.text, fontSize: 16 }}>
                        {latest ? `${latest.value} cm` : "-- cm"}
                    </Text>
                    <Pressable
                        onPress={onAdd}
                        style={{
                            padding: 6,
                            borderRadius: 6,
                            backgroundColor: theme.primary + "22",
                        }}
                    >
                        <Plus size={16} color={theme.primary} />
                    </Pressable>
                    {measurements.length > 0 && (
                        expanded ? (
                            <ChevronUp size={18} color={theme.text} />
                        ) : (
                            <ChevronDown size={18} color={theme.text} />
                        )
                    )}
                </View>
            </Pressable>
            {expanded && measurements.length > 0 && (
                <View
                    style={{
                        paddingHorizontal: 14,
                        paddingBottom: 14,
                        borderTopWidth: 1,
                        borderTopColor: theme.primary + "22",
                    }}
                >
                    {[...measurements]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map((m, i) => (
                            <View
                                key={i}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    paddingVertical: 8,
                                    borderBottomWidth: i < Math.min(measurements.length, 5) - 1 ? 1 : 0,
                                    borderBottomColor: theme.primary + "11",
                                }}
                            >
                                <Text style={{ color: theme.text, fontSize: 14 }}>
                                    {formatDate(m.date)}
                                </Text>
                                <Text style={{ color: theme["text-light"], fontSize: 14 }}>
                                    {m.value} cm
                                </Text>
                            </View>
                        ))}
                </View>
            )}
        </View>
    );
};

const InputModal = ({
    visible,
    onClose,
    onSave,
    title,
    unit,
    initialValue,
}: {
    visible: boolean;
    onClose: () => void;
    onSave: (value: number) => void;
    title: string;
    unit: string;
    initialValue?: number;
}) => {
    const { theme } = useTheme();
    const [value, setValue] = useState(initialValue?.toString() ?? "");

    useEffect(() => {
        if (visible) {
            setValue(initialValue?.toString() ?? "");
        }
    }, [visible, initialValue]);

    const handleSave = () => {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
            onSave(num);
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View
                style={{
                    flex: 1,
                    backgroundColor: "#00000099",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 24,
                }}
            >
                <View
                    style={{
                        backgroundColor: theme.panel,
                        borderRadius: 20,
                        padding: 24,
                        width: "100%",
                        maxWidth: 320,
                        borderWidth: 1,
                        borderColor: theme.primary + "44",
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 20,
                        }}
                    >
                        <Text
                            style={{
                                color: theme["text-light"],
                                fontSize: 18,
                                fontWeight: "600",
                            }}
                        >
                            {title}
                        </Text>
                        <Pressable onPress={onClose} style={{ padding: 4 }}>
                            <X size={20} color={theme.text} />
                        </Pressable>
                    </View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: theme.background,
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            marginBottom: 20,
                        }}
                    >
                        <TextInput
                            value={value}
                            onChangeText={setValue}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={theme.text + "66"}
                            style={{
                                flex: 1,
                                color: theme["text-light"],
                                fontSize: 24,
                                paddingVertical: 16,
                            }}
                        />
                        <Text style={{ color: theme.text, fontSize: 16 }}>{unit}</Text>
                    </View>
                    <Pressable
                        onPress={handleSave}
                        style={{
                            backgroundColor: theme.primary,
                            borderRadius: 12,
                            padding: 14,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                            Save
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

// Main component
export default function ProfileStatsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [stats, setStats] = useState<BodyStats>(defaultStats);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        unit: string;
        initialValue?: number;
        onSave: (value: number) => void;
    }>({
        visible: false,
        title: "",
        unit: "",
        onSave: () => { },
    });

    // Load stats
    useEffect(() => {
        const load = async () => {
            const saved = await loadObject<BodyStats>(STORAGE_KEY);
            if (saved) {
                setStats(saved);
            }
            setLoading(false);
        };
        load();
    }, []);

    // Save stats
    const persistStats = useCallback(async (newStats: BodyStats) => {
        setStats(newStats);
        await saveObject(STORAGE_KEY, newStats);
    }, []);

    // Handlers
    const handleEditHeight = () => {
        setModalConfig({
            visible: true,
            title: "Edit Height",
            unit: "cm",
            initialValue: stats.height ?? undefined,
            onSave: (value) => {
                persistStats({ ...stats, height: value });
            },
        });
    };

    const handleAddWeight = () => {
        setModalConfig({
            visible: true,
            title: "Add Weight",
            unit: "kg",
            initialValue: stats.weightHistory.length > 0
                ? stats.weightHistory[stats.weightHistory.length - 1].value
                : undefined,
            onSave: (value) => {
                const newHistory = [
                    ...stats.weightHistory,
                    { value, date: new Date().toISOString() },
                ];
                persistStats({ ...stats, weightHistory: newHistory });
            },
        });
    };

    const handleAddMeasurement = (key: keyof BodyStats["measurements"], label: string) => {
        const current = stats.measurements[key];
        setModalConfig({
            visible: true,
            title: `Add ${label}`,
            unit: "cm",
            initialValue: current.length > 0 ? current[current.length - 1].value : undefined,
            onSave: (value) => {
                const newMeasurements = {
                    ...stats.measurements,
                    [key]: [
                        ...stats.measurements[key],
                        { value, date: new Date().toISOString() },
                    ],
                };
                persistStats({ ...stats, measurements: newMeasurements });
            },
        });
    };

    // Computed values
    const latestWeight =
        stats.weightHistory.length > 0
            ? stats.weightHistory[stats.weightHistory.length - 1].value
            : null;
    const weightTrend = getTrend(stats.weightHistory);
    const bmi =
        latestWeight && stats.height
            ? calculateBMI(latestWeight, stats.height)
            : null;
    const bmiInfo = bmi ? getBMICategory(bmi) : null;

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: theme.text }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Header */}
            <View
                style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.primary + "33",
                    backgroundColor: theme.panel + "E6",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
                    <ArrowLeft size={22} color={theme.primary} />
                </Pressable>
                <Text
                    style={{
                        color: theme["text-light"],
                        fontSize: 24,
                        fontWeight: "bold",
                        letterSpacing: 0.1,
                    }}
                >
                    BODY STATS
                </Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                {/* Main Stats */}
                <Text
                    style={{
                        color: theme["text-light"],
                        fontSize: 16,
                        fontWeight: "600",
                        marginBottom: 12,
                        marginLeft: 4,
                    }}
                >
                    Overview
                </Text>

                <StatCard
                    label="Height"
                    value={stats.height}
                    unit="cm"
                    icon={<Ruler size={20} color={theme.primary} />}
                    onEdit={handleEditHeight}
                />

                <StatCard
                    label="Weight"
                    value={latestWeight}
                    unit="kg"
                    trend={weightTrend}
                    icon={<Scale size={20} color={theme.primary} />}
                    onAdd={handleAddWeight}
                    subtitle={
                        stats.weightHistory.length > 0
                            ? `Last: ${formatDate(stats.weightHistory[stats.weightHistory.length - 1].date)}`
                            : undefined
                    }
                />

                {/* BMI Card */}
                {bmi && bmiInfo && (
                    <View
                        style={{
                            backgroundColor: theme.panel + "CC",
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: theme.primary + "33",
                            marginBottom: 12,
                        }}
                    >
                        <Text style={{ color: theme.text, fontSize: 14, marginBottom: 4 }}>
                            BMI (Body Mass Index)
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                            <Text
                                style={{
                                    color: theme["text-light"],
                                    fontSize: 28,
                                    fontWeight: "700",
                                }}
                            >
                                {bmi.toFixed(1)}
                            </Text>
                            <View
                                style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                    backgroundColor: bmiInfo.color + "22",
                                }}
                            >
                                <Text
                                    style={{
                                        color: bmiInfo.color,
                                        fontSize: 14,
                                        fontWeight: "600",
                                    }}
                                >
                                    {bmiInfo.label}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Body Measurements */}
                <Text
                    style={{
                        color: theme["text-light"],
                        fontSize: 16,
                        fontWeight: "600",
                        marginTop: 16,
                        marginBottom: 12,
                        marginLeft: 4,
                    }}
                >
                    Body Measurements
                </Text>

                <MeasurementItem
                    label="Chest"
                    measurements={stats.measurements.chest}
                    onAdd={() => handleAddMeasurement("chest", "Chest")}
                />
                <MeasurementItem
                    label="Waist"
                    measurements={stats.measurements.waist}
                    onAdd={() => handleAddMeasurement("waist", "Waist")}
                />
                <MeasurementItem
                    label="Hips"
                    measurements={stats.measurements.hips}
                    onAdd={() => handleAddMeasurement("hips", "Hips")}
                />
                <MeasurementItem
                    label="Left Arm"
                    measurements={stats.measurements.leftArm}
                    onAdd={() => handleAddMeasurement("leftArm", "Left Arm")}
                />
                <MeasurementItem
                    label="Right Arm"
                    measurements={stats.measurements.rightArm}
                    onAdd={() => handleAddMeasurement("rightArm", "Right Arm")}
                />
                <MeasurementItem
                    label="Left Thigh"
                    measurements={stats.measurements.leftThigh}
                    onAdd={() => handleAddMeasurement("leftThigh", "Left Thigh")}
                />
                <MeasurementItem
                    label="Right Thigh"
                    measurements={stats.measurements.rightThigh}
                    onAdd={() => handleAddMeasurement("rightThigh", "Right Thigh")}
                />

                {/* Spacer for bottom */}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Input Modal */}
            <InputModal
                visible={modalConfig.visible}
                onClose={() => setModalConfig({ ...modalConfig, visible: false })}
                onSave={modalConfig.onSave}
                title={modalConfig.title}
                unit={modalConfig.unit}
                initialValue={modalConfig.initialValue}
            />
        </SafeAreaView>
    );
}
