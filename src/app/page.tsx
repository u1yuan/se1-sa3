import Reviewer from "@/components/Reviewer";
import { bank } from "@/lib/bank";

export default function Page() {
  return <Reviewer bank={bank} />;
}
