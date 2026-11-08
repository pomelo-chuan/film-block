import { t } from "@/i18n";
import { Component, type ReactNode } from "react";
// Keep the editor and its in-memory originals mounted if an on-demand chunk fails.
export class FeatureBoundary extends Component<
  {
    children: ReactNode;
  },
  {
    failed: boolean;
  }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p role="alert" className="p-3 text-xs text-muted-foreground">
        {t("此功能暂时无法加载，请检查网络后刷新重试。")}
      </p>
    ) : (
      this.props.children
    );
  }
}
