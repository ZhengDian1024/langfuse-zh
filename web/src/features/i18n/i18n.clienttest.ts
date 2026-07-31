import enMessages from "../../../i18n/en.json";
import zhMessages from "../../../i18n/zh.json";

/**
 * 国际化翻译键对齐校验。
 *
 * `useI18n` 的 `MessageKey = keyof typeof enMessages`，typecheck 只能保证被 `t()` 引用的
 * key 在 en.json 中存在；它无法保证 zh.json 同步。本测试断言 en/zh 两个文件拥有完全相同
 * 的键集合（含嵌套结构），防止新增 key 时只写 en 漏写 zh。
 *
 * 改造背景见 `web/i18n/PLAN.md` §五。
 */
function leafKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    leafKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("i18n message parity", () => {
  const enKeys = new Set(leafKeys(enMessages));
  const zhKeys = new Set(leafKeys(zhMessages));

  it("zh.json 拥有与 en.json 完全相同的键集合", () => {
    const onlyInEn = [...enKeys].filter((k) => !zhKeys.has(k));
    const onlyInZh = [...zhKeys].filter((k) => !enKeys.has(k));
    expect(onlyInEn).toEqual([]);
    expect(onlyInZh).toEqual([]);
  });

  it("zh.json 不含空字符串值（防止 goal 写占位时漏填）", () => {
    const empties = Object.entries(zhMessages as Record<string, unknown>)
      .filter(([, v]) => v === "")
      .map(([k]) => k);
    expect(empties).toEqual([]);
  });
});
