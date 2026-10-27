import { tex } from "@/lib/rich";

const T = ({ s }: { s: string }) => <span dangerouslySetInnerHTML={{ __html: tex(s) }} />;

/** Student-produced response directions; shown in the left pane of grid-in questions. */
export function SprDirections() {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed">
      <h2 className="text-lg font-bold">Student-produced response directions</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>If you find more than one correct answer, enter only one answer.</li>
        <li>
          You can enter up to 5 characters for a positive answer and up to 6 characters (including the
          negative sign) for a negative answer.
        </li>
        <li>
          If your answer is a fraction that doesn&apos;t fit in the provided space, enter the decimal
          equivalent.
        </li>
        <li>
          If your answer is a decimal that doesn&apos;t fit in the provided space, enter it by truncating
          or rounding at the fourth digit.
        </li>
        <li>
          If your answer is a mixed number (such as <T s="3\tfrac{1}{2}" />), enter it as an improper
          fraction (7/2) or its decimal equivalent (3.5).
        </li>
        <li>Don&apos;t enter symbols such as a percent sign, comma, or dollar sign.</li>
      </ul>
      <p className="font-bold">Examples</p>
      <table className="w-full border-collapse text-center text-sm">
        <thead>
          <tr className="bg-bb-bar">
            <th className="border border-[#1e1e1e] p-2">Answer</th>
            <th className="border border-[#1e1e1e] p-2">Acceptable ways to enter answer</th>
            <th className="border border-[#1e1e1e] p-2">Unacceptable: will NOT receive credit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[#1e1e1e] p-2"><T s="3.5" /></td>
            <td className="border border-[#1e1e1e] p-2">3.5<br />3.50<br />7/2</td>
            <td className="border border-[#1e1e1e] p-2">31/2<br />3 1/2</td>
          </tr>
          <tr>
            <td className="border border-[#1e1e1e] p-2"><T s="\dfrac{2}{3}" /></td>
            <td className="border border-[#1e1e1e] p-2">2/3<br />.6666<br />.6667<br />0.666<br />0.667</td>
            <td className="border border-[#1e1e1e] p-2">0.66<br />.66<br />0.67<br />.67</td>
          </tr>
          <tr>
            <td className="border border-[#1e1e1e] p-2"><T s="-\dfrac{1}{3}" /></td>
            <td className="border border-[#1e1e1e] p-2">-1/3<br />-.3333<br />-0.333</td>
            <td className="border border-[#1e1e1e] p-2">-.33<br />-0.33</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** General math section directions, shown from the "Directions" dropdown. */
export function MathDirections() {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed">
      <p>
        The questions in this section address a number of important math skills. Use of a calculator
        is permitted for all questions. A reference sheet, calculator, and these directions can be
        accessed throughout the test.
      </p>
      <p>Unless otherwise indicated:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>All variables and expressions represent real numbers.</li>
        <li>Figures provided are drawn to scale.</li>
        <li>All figures lie in a plane.</li>
        <li>
          The domain of a given function <T s="f" /> is the set of all real numbers <T s="x" /> for
          which <T s="f(x)" /> is a real number.
        </li>
      </ul>
      <p>
        For <strong>multiple-choice questions</strong>, solve each problem and choose the correct
        answer from the choices provided. Each multiple-choice question has a single correct answer.
      </p>
      <p>
        For <strong>student-produced response questions</strong>, solve each problem and enter your
        answer as described below.
      </p>
      <div className="rounded border border-bb-line p-4">
        <SprDirections />
      </div>
    </div>
  );
}
