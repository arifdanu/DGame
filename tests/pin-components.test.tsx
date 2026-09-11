import { webcrypto } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { checkPin, makePin } from "../src/engine/pin";
import { Parent } from "../src/pages/Parent";
import { PinForm } from "../src/components/PinForm";
import { useSpeech } from "../src/hooks/useSpeech";
import { initialData, reloadStorage, STORAGE_KEY } from "../src/storage/store";
beforeAll(() => {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
});
describe("PIN", () => {
  it("salt acak, derivasi, PIN benar dan salah", async () => {
    const p = await makePin("123456");
    const other = await makePin("123456");
    expect(p.salt).not.toBe(other.salt);
    expect(p.hash).not.toContain("123456");
    expect((await checkPin("654321", p)).ok).toBe(false);
    expect((await checkPin("123456", p)).ok).toBe(true);
    await expect(makePin("123")).rejects.toThrow();
  });
  it("cooldown setelah 5 kesalahan bertahan dan dapat dicoba setelah 30 detik", async () => {
    let p = await makePin("123456");
    for (let i = 0; i < 5; i++) p = (await checkPin("000000", p, 1000)).pin;
    expect(p.cooldownUntil).toBe(31000);
    expect((await checkPin("123456", p, 30000)).ok).toBe(false);
    expect((await checkPin("123456", p, 31001)).ok).toBe(true);
  });
  it("panel tidak merender pengaturan tanpa PIN", async () => {
    const d = initialData();
    d.pin = await makePin("123456");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    reloadStorage();
    render(
      <BrowserRouter>
        <Parent />
      </BrowserRouter>,
    );
    expect(screen.queryByText("Pengaturan bersama")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Buka panel" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("PIN enam digit"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buka panel" }));
    await screen.findByText("PIN belum cocok. Coba kembali.");
    expect(screen.queryByText("Pengaturan bersama")).not.toBeInTheDocument();
  });
  it("setup menolak konfirmasi yang berbeda", () => {
    const submit = vi.fn();
    render(<PinForm create label="Simpan" onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Buat PIN enam digit"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("Ulangi PIN"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(screen.getByRole("alert")).toHaveTextContent("belum sama");
    expect(submit).not.toHaveBeenCalled();
  });
});
function SpeechTest() {
  const { speak, notice } = useSpeech(true);
  return (
    <>
      <button onClick={() => speak("Halo Kiko")}>Dengarkan</button>
      <p role="status">{notice}</p>
    </>
  );
}
it("TTS tidak tersedia memiliki fallback teks", () => {
  render(<SpeechTest />);
  fireEvent.click(screen.getByText("Dengarkan"));
  expect(screen.getByRole("status")).toHaveTextContent("belum mendukung suara");
});
it("TTS tanpa suara Indonesia tidak memakai suara bahasa lain", async () => {
  const speak = vi.fn();
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      getVoices: () => [{ lang: "en-US" }],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      cancel: vi.fn(),
      speak,
    },
  });
  render(<SpeechTest />);
  fireEvent.click(screen.getByText("Dengarkan"));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Indonesia belum tersedia",
    ),
  );
  expect(speak).not.toHaveBeenCalled();
  Reflect.deleteProperty(window, "speechSynthesis");
});
