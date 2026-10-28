import { ObservedNoticeView } from "@/modules/applications/frontend/components/observed-notice-view";

export default function CorrectApplicationPage({
  params,
}: {
  params: { token: string };
}) {
  return <ObservedNoticeView token={params.token} />;
}
