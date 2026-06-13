import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useStorage } from "@/context/StorageContext";
import type { Record } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  initialType?: "lent" | "borrowed";
  editRecord?: Record | null;
  openPayment?: boolean;
}

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function AddRecordModal({ visible, onClose, initialType = "lent", editRecord, openPayment }: Props) {
  const c = useColors();
  const { createRecord, updateRecord, addPayment, deletePayment, settings } = useStorage();
  const scrollRef = useRef<ScrollView>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"lent" | "borrowed">(initialType);
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payDate, setPayDate] = useState("");

  const isEdit = !!editRecord;

  useEffect(() => {
    if (visible) {
      if (editRecord) {
        setName(editRecord.name);
        setAmount(String(editRecord.amount));
        setType(editRecord.type);
        setNote(editRecord.note);
        setDate(editRecord.date);
        setDueDate(editRecord.due_date);
      } else {
        setName("");
        setAmount("");
        setType(initialType);
        setNote("");
        setDate("");
        setDueDate("");
      }
      const shouldOpenPay = !!(openPayment && editRecord && !editRecord.settled);
      setShowPaymentForm(shouldOpenPay);
      setPayAmount("");
      setPayNote("");
      setPayDate("");
      if (shouldOpenPay) {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350);
      }
    }
  }, [visible, editRecord, initialType, openPayment]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Name required"); return; }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { Alert.alert("Enter a valid amount"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isEdit && editRecord) {
      await updateRecord(editRecord.id, { name: name.trim(), amount: amt, type, note, date: date || todayStr(), due_date: dueDate });
    } else {
      await createRecord(name.trim(), amt, type, note, date, dueDate);
    }
    onClose();
  };

  const handleAddPayment = async () => {
    if (!editRecord) return;
    const amt = parseFloat(payAmount);
    const remaining = editRecord.amount - editRecord.paid_amount;
    if (!payAmount || isNaN(amt) || amt <= 0) { Alert.alert("Enter valid amount"); return; }
    if (amt > remaining) { Alert.alert("Amount exceeds remaining balance"); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addPayment(editRecord.id, amt, payNote, payDate);
    setShowPaymentForm(false);
    setPayAmount("");
    setPayNote("");
    setPayDate("");
    onClose();
  };

  const inp = (placeholder: string, value: string, onChange: (v: string) => void, extra?: object) => (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={c.text3}
      value={value}
      onChangeText={onChange}
      style={[styles.input, { backgroundColor: c.card2, borderColor: c.border, color: c.text, fontFamily: "Inter_400Regular" }]}
      {...extra}
    />
  );

  const currency = settings.currency;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.container, { backgroundColor: c.background }]}>
          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={c.text2} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: c.text, fontFamily: "Inter_700Bold" }]}>
              {isEdit ? "Edit Record" : "Add Record"}
            </Text>
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: c.primary }]}>
              <Text style={[styles.saveBtnText, { color: "#000", fontFamily: "Inter_700Bold" }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>TYPE</Text>
            <View style={[styles.typeRow, { backgroundColor: c.card, borderColor: c.border }]}>
              <Pressable
                style={[styles.typeBtn, type === "lent" && { backgroundColor: c.primary }]}
                onPress={() => setType("lent")}
              >
                <Text style={[styles.typeBtnText, { color: type === "lent" ? "#000" : c.text2, fontFamily: "Inter_600SemiBold" }]}>I Lent</Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, type === "borrowed" && { backgroundColor: c.danger }]}
                onPress={() => setType("borrowed")}
              >
                <Text style={[styles.typeBtnText, { color: type === "borrowed" ? "#fff" : c.text2, fontFamily: "Inter_600SemiBold" }]}>I Borrowed</Text>
              </Pressable>
            </View>

            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>PERSON NAME</Text>
            {inp("Who did you lend/borrow from?", name, setName)}

            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>AMOUNT ({currency})</Text>
            {inp("0", amount, setAmount, { keyboardType: "decimal-pad" })}

            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>NOTE (optional)</Text>
            {inp("What's it for?", note, setNote, { multiline: true, numberOfLines: 3, textAlignVertical: "top", style: [styles.input, styles.textarea, { backgroundColor: c.card2, borderColor: c.border, color: c.text, fontFamily: "Inter_400Regular" }] })}

            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>DATE (DD/MM/YYYY)</Text>
            {inp("Leave blank for today", date, setDate, { keyboardType: "numeric" })}

            <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>DUE DATE (optional)</Text>
            {inp("DD/MM/YYYY", dueDate, setDueDate, { keyboardType: "numeric" })}

            {isEdit && editRecord && (
              <View style={styles.paySection}>
                <View style={[styles.divider, { backgroundColor: c.border }]} />
                <Text style={[styles.sectionTitle, { color: c.text, fontFamily: "Inter_700Bold" }]}>Payment History</Text>

                <View style={styles.payStats}>
                  <View style={[styles.payStat, { backgroundColor: c.card2, borderColor: c.border }]}>
                    <Text style={[styles.payStatLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Total</Text>
                    <Text style={[styles.payStatValue, { color: c.text, fontFamily: "Inter_700Bold" }]}>{currency}{editRecord.amount.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.payStat, { backgroundColor: c.card2, borderColor: c.border }]}>
                    <Text style={[styles.payStatLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Paid</Text>
                    <Text style={[styles.payStatValue, { color: c.primary, fontFamily: "Inter_700Bold" }]}>{currency}{editRecord.paid_amount.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.payStat, { backgroundColor: c.card2, borderColor: c.border }]}>
                    <Text style={[styles.payStatLabel, { color: c.text3, fontFamily: "Inter_400Regular" }]}>Left</Text>
                    <Text style={[styles.payStatValue, { color: c.danger, fontFamily: "Inter_700Bold" }]}>{currency}{(editRecord.amount - editRecord.paid_amount).toLocaleString()}</Text>
                  </View>
                </View>

                {editRecord.paid_amount > 0 && (
                  <View style={[styles.progressBar, { backgroundColor: c.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: c.primary, width: `${Math.min(editRecord.paid_amount / editRecord.amount, 1) * 100}%` }]} />
                  </View>
                )}

                {editRecord.payments.map(p => (
                  <View key={p.id} style={[styles.payRow, { backgroundColor: c.card2, borderColor: c.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.payAmt, { color: c.primary, fontFamily: "Inter_600SemiBold" }]}>{currency}{p.amount.toLocaleString()}</Text>
                      <Text style={[styles.payMeta, { color: c.text3, fontFamily: "Inter_400Regular" }]}>{p.date}{p.note ? ` • ${p.note}` : ""}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); deletePayment(editRecord.id, p.id); onClose(); }}>
                      <Feather name="x" size={16} color={c.danger} />
                    </TouchableOpacity>
                  </View>
                ))}

                {!editRecord.settled && (
                  showPaymentForm ? (
                    <View style={[styles.payForm, { backgroundColor: c.card, borderColor: c.border }]}>
                      <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>PAYMENT AMOUNT</Text>
                      {inp(`Max ${currency}${(editRecord.amount - editRecord.paid_amount).toLocaleString()}`, payAmount, setPayAmount, { keyboardType: "decimal-pad" })}
                      <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>NOTE</Text>
                      {inp("Optional", payNote, setPayNote)}
                      <Text style={[styles.label, { color: c.text2, fontFamily: "Inter_500Medium" }]}>DATE</Text>
                      {inp("DD/MM/YYYY", payDate, setPayDate, { keyboardType: "numeric" })}
                      <View style={styles.payFormBtns}>
                        <TouchableOpacity style={[styles.ghostBtn, { borderColor: c.border }]} onPress={() => setShowPaymentForm(false)}>
                          <Text style={[styles.ghostBtnText, { color: c.text2, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: c.primary }]} onPress={handleAddPayment}>
                          <Text style={[styles.primaryBtnText, { color: "#000", fontFamily: "Inter_700Bold" }]}>Add Payment</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.addPayBtn, { borderColor: c.blue + "50", backgroundColor: c.blue + "10" }]}
                      onPress={() => setShowPaymentForm(true)}
                    >
                      <Feather name="plus" size={16} color={c.blue} />
                      <Text style={[styles.addPayBtnText, { color: c.blue, fontFamily: "Inter_600SemiBold" }]}>Add Payment</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  closeBtn: { width: 40, alignItems: "flex-start" },
  title: { fontSize: 18 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { fontSize: 14 },
  form: { padding: 20, gap: 8 },
  label: { fontSize: 11, letterSpacing: 0.8, marginTop: 8 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  textarea: { height: 80, paddingTop: 12 },
  typeRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  typeBtnText: { fontSize: 15 },
  divider: { height: 1, marginVertical: 16 },
  sectionTitle: { fontSize: 17, marginBottom: 8 },
  payStats: { flexDirection: "row", gap: 8, marginBottom: 10 },
  payStat: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  payStatLabel: { fontSize: 11 },
  payStatValue: { fontSize: 16, marginTop: 2 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: 6, borderRadius: 3 },
  payRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  payAmt: { fontSize: 15 },
  payMeta: { fontSize: 12, marginTop: 2 },
  paySection: { marginTop: 8 },
  payForm: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginTop: 10 },
  payFormBtns: { flexDirection: "row", gap: 8, marginTop: 8 },
  ghostBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  ghostBtnText: { fontSize: 14 },
  primaryBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  primaryBtnText: { fontSize: 14 },
  addPayBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  addPayBtnText: { fontSize: 14 },
});
