import { Home } from "@/components/home/Home";
import { QUESTIONS } from "@/data/questions";

export default function Page() {
  return <Home bank={QUESTIONS} />;
}
