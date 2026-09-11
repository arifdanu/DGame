import { describe, expect, it, vi } from "vitest";
import {
  ActiveClock,
  charge,
  jakartaDay,
  remaining,
} from "../src/engine/timer";
import {
  blankProfile,
  initialData,
  readStorage,
  STORAGE_KEY,
  validData,
  writeStorage,
} from "../src/storage/store";
describe("penyimpanan", () => {
  it("memvalidasi schema dan bentuk data bersarang", () => {
    const d = initialData();
    expect(validData(d)).toBe(true);
    expect(validData({ ...d, schemaVersion: 9 })).toBe(false);
    expect(
      validData({
        ...d,
        profiles: {
          ...d.profiles,
          delisha: { ...d.profiles.delisha, usage: { invalid: -1 } },
        },
      }),
    ).toBe(false);
    expect(validData({ ...d, pin: { salt: "plaintext" } })).toBe(false);
  });
  it("mempertahankan data rusak tanpa menulis ulang", () => {
    const getItem = vi.fn(() => "{rusak"),
      setItem = vi.fn();
    const result = readStorage({ getItem });
    expect(result.blocked).toBe(true);
    expect(result.warning).toContain("tetap dipertahankan");
    expect(setItem).not.toHaveBeenCalled();
  });
  it("storage tidak tersedia atau penuh ditangani", () => {
    expect(
      readStorage({
        getItem() {
          throw new Error("denied");
        },
      }).warning,
    ).toBeTruthy();
    expect(
      writeStorage(
        {
          setItem() {
            throw new Error("quota");
          },
        },
        initialData(),
      ),
    ).toBe(false);
  });
  it("round trip menyimpan sesi, draft, dan progres", () => {
    const d = initialData();
    d.profiles.delisha.usage["2026-09-10"] = 1234;
    localStorage.clear();
    expect(writeStorage(localStorage, d)).toBe(true);
    expect(readStorage(localStorage).data).toEqual(d);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });
});
describe("timer", () => {
  it("pause/resume hanya menghitung interval aktif", () => {
    const commit = vi.fn();
    const c = new ActiveClock(commit);
    c.setActive(true, 0);
    c.flush(1000);
    c.setActive(false, 1500);
    c.flush(10000);
    c.setActive(true, 20000);
    c.flush(22000);
    expect(commit.mock.calls).toEqual([
      [0, 1000],
      [1000, 1500],
      [20000, 22000],
    ]);
  });
  it("refresh dan profil lain tidak mereset pemakaian", () => {
    const now = Date.parse("2026-09-10T10:00:00+07:00");
    const p = charge(blankProfile(), now, now + 60000);
    const d = initialData();
    d.profiles.delisha = p;
    writeStorage(localStorage, d);
    expect(
      remaining(readStorage(localStorage).data.profiles.delisha, now),
    ).toBe(14 * 60000);
    expect(remaining(d.profiles.dinar, now)).toBe(15 * 60000);
  });
  it("membagi pergantian tanggal di Asia/Jakarta", () => {
    const start = Date.parse("2026-09-10T23:59:59+07:00");
    const p = charge(blankProfile(), start, start + 2000);
    expect(p.usage).toEqual({ "2026-09-10": 1000, "2026-09-11": 1000 });
    expect(jakartaDay(start + 2000)).toBe("2026-09-11");
  });
  it("mengunci pada batas dan tidak mencatat waktu melebihi jatah", () => {
    const now = Date.parse("2026-09-10T00:00:00+07:00");
    const p = charge(blankProfile(), now, now + 20 * 60000);
    expect(remaining(p, now)).toBe(0);
    expect(p.usage[jakartaDay(now)]).toBe(15 * 60000);
    expect(remaining(p, now + 86400000)).toBe(15 * 60000);
  });
});
it("durasi per kemampuan dicatat terpisah tanpa melebihi jatah", () => {
  const now = Date.parse("2026-09-10T10:00:00+07:00");
  let p = charge(blankProfile(), now, now + 30000, "angka");
  p = charge(p, now + 30000, now + 45000, "kata");
  expect(p.skillMs).toEqual({ angka: 30000, kata: 15000 });
});
