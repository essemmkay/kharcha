import { Redirect } from "expo-router";

// Placeholder route backing the center "Add" tab slot. Its tab button opens the
// transaction modal directly (see _layout AddButton), so this never renders;
// the redirect only covers a stray deep-link to /add.
export default function Add() {
  return <Redirect href="/" />;
}
