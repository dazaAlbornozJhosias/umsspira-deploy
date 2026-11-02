import { redirect } from "next/navigation";
import { ObservedNoticeView } from "@/modules/applications/frontend/components/observed-notice-view";
import { isValidCorrectionTokenFormat } from "@/modules/applications/frontend/constants/correction.constants";

export default function CorrectApplicationPage({
  params,
}: {
  params: { token: string };
}) {
  const token = params?.token;
  if (!isValidCorrectionTokenFormat(token)) {
    redirect("/login");
  }

  return <ObservedNoticeView token={token} />;
}
