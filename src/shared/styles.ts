import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 16,
  },
  contentContainerWithMargin: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderColor: "#ccc",
    borderStyle: "solid",
    borderWidth: 1,
    margin: 16,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    gap: 10,
    fontWeight: "bold",
  },
  errorMessage: {
    color: "red",
    fontWeight: "bold",
    borderRadius: 5,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 12,
    color: "#666",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "left",
  },
  input: {
    width: "100%",
    padding: 10,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    fontSize: 16,
  },
  inputForm: {
    padding: 8,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  inputTitle: {
    fontSize: 16,
  },
  button: {
    fontSize: 16,
    backgroundColor: "#2c2c2c",
    paddingHorizontal: 64,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
});
