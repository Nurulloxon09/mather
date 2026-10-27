import { defineChapter } from "../define";

const r = String.raw;
const L1 = "Linear equations in one variable";
const LF = "Linear functions";
const L2 = "Linear equations in two variables";
const SYS = "Systems of two linear equations in two variables";
const INEQ = "Linear inequalities in one or two variables";
const fig = (name: string, w = 300) => `![graph](/figures/mhb/${name}.png){w=${w}}`;

export const algebra = defineChapter({
  source: "Math Hard Book",
  prefix: "mhb-alg",
  domain: "Algebra",
  difficulty: "Hard",
  questions: [
    {
      n: 1,
      skill: L2,
      page: 7,
      stem: r`In the $xy$-plane, line $k$ and line $l$ are perpendicular and intersect at the point $(2, 8)$. If line $k$ is defined by the equation $y = mx + b$, where $m$ and $b$ are constants and $m > 1$, which of the following points lies on line $l$?`,
      choices: [
        r`$\left(3,\ 8-\dfrac{1}{m}\right)$`,
        r`$\left(3,\ 8+\dfrac{1}{m}\right)$`,
        r`$(3,\ 8-m)$`,
        r`$(3,\ 8+m)$`,
      ],
      answer: "A",
      explanation: r`Perpendicular lines have slopes that are negative reciprocals. Line $k$ has slope $m$, so line $l$ has slope $-\dfrac{1}{m}$.

Line $l$ passes through $(2, 8)$. Moving 1 unit to the right, from $x = 2$ to $x = 3$, changes $y$ by the slope, so $y = 8 - \dfrac{1}{m}$.

The point $\left(3,\ 8-\dfrac{1}{m}\right)$ lies on line $l$.`,
    },
    {
      n: 2,
      skill: LF,
      page: 7,
      stem: r`Kyle invented a new temperature scale he called the Tutorllini scale. The function $T(x)$ gives the temperature, in degrees Torte, that corresponds to a temperature of $x$ degrees Celsius.

$$T(x) = \frac{3}{4}\left(\frac{26x}{7} - 800\right) + 15.50$$

If a temperature increased by 3.3 degrees Torte, by how much did the temperature increase, in degrees Celsius?`,
      grid: ["77/65", "1.18"],
      explanation: r`$T$ is linear. Distributing, the coefficient of $x$ is $\dfrac{3}{4}\cdot\dfrac{26}{7} = \dfrac{39}{14}$, so each degree Celsius adds $\dfrac{39}{14}$ degrees Torte.

An increase of 3.3 degrees Torte corresponds to
$$\Delta x = \frac{3.3}{39/14} = \frac{3.3 \cdot 14}{39} = \frac{77}{65} \approx 1.1846$$
degrees Celsius. Accepted: $77/65$, $1.184$, $1.185$ (the book's key lists $1.18$).`,
    },
    {
      n: 3,
      skill: SYS,
      page: 7,
      stem: r`In the given system of equations, $p$ is a constant. If the system has no solution, what is the value of $p$?

$$\begin{aligned}\tfrac{3}{2}y - \tfrac{1}{4}x &= \tfrac{2}{3} - \tfrac{3}{2}y\\ \tfrac{1}{6}x + \tfrac{3}{6} &= py + \tfrac{9}{5}\end{aligned}$$`,
      grid: ["2"],
      explanation: r`A linear system has no solution when the lines are parallel: same slope, different intercepts.

First equation: $3y = \tfrac{1}{4}x + \tfrac{2}{3}$, so $y = \tfrac{1}{12}x + \tfrac{2}{9}$. Slope $\tfrac{1}{12}$.

Second equation: $py = \tfrac{1}{6}x - \tfrac{13}{10}$, so $y = \tfrac{1}{6p}x - \tfrac{13}{10p}$. Slope $\tfrac{1}{6p}$.

Setting $\tfrac{1}{6p} = \tfrac{1}{12}$ gives $p = 2$. The intercepts are then $\tfrac{2}{9}$ and $-\tfrac{13}{20}$, which differ, so there is no solution.`,
    },
    {
      n: 4,
      skill: SYS,
      page: 7,
      stem: r`In the given system of equations, $t$ is a constant. If the system has no solution, what is the value of $t$?

$$\begin{aligned}4x - 6y &= 10y + 2\\ ty &= \tfrac{1}{2} + 2x\end{aligned}$$`,
      grid: ["8"],
      explanation: r`First equation: $4x - 16y = 2$, so $y = \tfrac{1}{4}x - \tfrac{1}{8}$.

Second equation: $y = \tfrac{2}{t}x + \tfrac{1}{2t}$.

No solution means equal slopes and different intercepts: $\tfrac{2}{t} = \tfrac{1}{4}$, so $t = 8$. Then the intercepts are $-\tfrac{1}{8}$ and $\tfrac{1}{16}$, which differ.`,
    },
    {
      n: 5,
      skill: L1,
      page: 7,
      stem: r`$$\frac{20}{p} = \frac{20}{q} - \frac{20}{r} - \frac{20}{s}$$

The given equation relates the positive variables $p$, $q$, $r$, and $s$. Which of the following is equivalent to $q$?`,
      choices: [
        r`$p + r + s$`,
        r`$20(p + r + s)$`,
        r`$\dfrac{prs}{pr + rs + ps}$`,
        r`$\dfrac{prs}{20p + 20r + 20s}$`,
      ],
      answer: "C",
      explanation: r`Divide every term by 20: $\dfrac{1}{p} = \dfrac{1}{q} - \dfrac{1}{r} - \dfrac{1}{s}$.

Isolate $\dfrac{1}{q}$:
$$\frac{1}{q} = \frac{1}{p} + \frac{1}{r} + \frac{1}{s} = \frac{rs + ps + pr}{prs}$$

Take reciprocals: $q = \dfrac{prs}{pr + rs + ps}$.`,
    },
    {
      n: 6,
      skill: L2,
      page: 8,
      stem: r`Energy per Gram of Typical Macronutrients
| Macronutrient | Food calories | Kilojoules |
|---|---|---|
| Protein | 4.0 | 16.7 |
| Fat | 9.0 | 37.7 |
| Carbohydrate | 4.0 | 16.7 |

The table above gives the typical amounts of energy per gram, expressed in both food calories and kilojoules, of the three macronutrients in food. If the 180 food calories in a granola bar come entirely from $p$ grams of protein, $f$ grams of fat, and $c$ grams of carbohydrate, which of the following expresses $f$ in terms of $p$ and $c$?`,
      choices: [
        r`$f = 20 + \dfrac{4}{9}(p + c)$`,
        r`$f = 20 - \dfrac{4}{9}(p + c)$`,
        r`$f = 20 - \dfrac{4}{9}(p - c)$`,
        r`$f = 20 + \dfrac{9}{4}(p + c)$`,
      ],
      answer: "B",
      explanation: r`Use the food-calorie column: protein and carbohydrate give 4 calories per gram and fat gives 9.
$$4p + 9f + 4c = 180$$

Solve for $f$: $9f = 180 - 4(p + c)$, so $f = 20 - \dfrac{4}{9}(p + c)$.`,
    },
    {
      n: 7,
      skill: LF,
      page: 8,
      stem: r`$$\begin{aligned}f(x) &= 3 + \lvert -2x - x^2 \rvert\\ g(w) &= \left\lvert -\frac{w}{w-1} \right\rvert - w + 5\end{aligned}$$

The functions $f$ and $g$ are defined by the given equations. If $f(-4) = c$, where $c$ is a constant, what is the value of $g(c)$?`,
      grid: ["-4.9"],
      explanation: r`$f(-4) = 3 + \lvert 8 - 16 \rvert = 3 + 8 = 11$, so $c = 11$.

$g(11) = \left\lvert -\dfrac{11}{10} \right\rvert - 11 + 5 = 1.1 - 6 = -4.9$.`,
    },
    {
      n: 8,
      skill: L1,
      page: 8,
      stem: r`The equation $9x + 5 = a(x + b)$, where $a$ and $b$ are constants, has no solutions. Which of the following must be true?

I. $a = 9$
II. $b = 5$
III. $b \neq \frac{5}{9}$`,
      choices: [r`I only`, r`III only`, r`I and III only`, r`None of the above`],
      answer: "C",
      explanation: r`Expand: $9x + 5 = ax + ab$. A linear equation has no solutions when the $x$-coefficients match but the constants don't.

So $a = 9$ (I is true) and $ab \neq 5$, which means $9b \neq 5$, or $b \neq \tfrac{5}{9}$ (III is true).

$b$ doesn't have to equal 5; for example, $b = 1$ works. So II need not be true.`,
    },
    {
      n: 9,
      skill: SYS,
      page: 8,
      stem: r`In the given pair of equations, $a$ and $b$ are constants. The graph of this pair of equations in the $xy$-plane is a pair of perpendicular lines. Which of the following pairs of equations also represents a pair of perpendicular lines?

$$\begin{cases}5x + 7y = 1\\ ax + by = 1\end{cases}$$`,
      choices: [
        r`$\begin{aligned}10x + 7y &= 1\\ ax - 2by &= 1\end{aligned}$`,
        r`$\begin{aligned}10x + 7y &= 1\\ ax + 2by &= 1\end{aligned}$`,
        r`$\begin{aligned}10x + 7y &= 1\\ 2ax + by &= 1\end{aligned}$`,
        r`$\begin{aligned}5x - 7y &= 1\\ ax + by &= 1\end{aligned}$`,
      ],
      answer: "B",
      explanation: r`The lines $A_1x + B_1y = C_1$ and $A_2x + B_2y = C_2$ are perpendicular exactly when $A_1A_2 + B_1B_2 = 0$ (the slopes $-\tfrac{A_1}{B_1}$ and $-\tfrac{A_2}{B_2}$ multiply to $-1$).

The given lines are perpendicular, so $5a + 7b = 0$.

Choice B: $10a + 7(2b) = 2(5a + 7b) = 0$, so these lines are perpendicular too.

Choices A ($10a - 14b$), C ($20a + 7b$) and D ($5a - 7b$) are not zero in general.`,
    },
    {
      n: 10,
      skill: SYS,
      page: 9,
      stem: r`For each real number $r$, which of the following points $(x, y)$ lies on the graph of both equations in the $xy$-plane for the given system?

$$\begin{aligned}3x + 2y &= 6\\ 6x + 4y &= 12\end{aligned}$$`,
      choices: [
        r`$\left(r,\ 3 - \dfrac{3}{2}r\right)$`,
        r`$\left(r,\ 3 - \dfrac{r}{2}\right)$`,
        r`$\left(3 - r,\ 3 - \dfrac{3}{2}r\right)$`,
        r`$\left(3,\ 2 - \dfrac{3}{2}r\right)$`,
      ],
      answer: "A",
      explanation: r`The second equation is the first one multiplied by 2, so both describe the same line, $2y = 6 - 3x$, or $y = 3 - \tfrac{3}{2}x$.

Any point with $x = r$ and $y = 3 - \tfrac{3}{2}r$ is on it: choice A.`,
    },
    {
      n: 11,
      skill: INEQ,
      page: 9,
      stem: r`In a set of four consecutive odd integers, where the integers are ordered from the least to the highest, the first integer is represented by $z$. The product of 24 and the third odd integer in the set is at most the value of 86 less than the sum of the first and fourth odd integers in the set. What is the highest possible value of $z$?`,
      grid: ["-9"],
      explanation: r`The integers are $z$, $z + 2$, $z + 4$, $z + 6$.

"24 times the third is at most 86 less than the sum of the first and fourth":
$$24(z + 4) \le (z + z + 6) - 86$$
$$24z + 96 \le 2z - 80 \quad\Rightarrow\quad 22z \le -176 \quad\Rightarrow\quad z \le -8$$

$z$ must be odd, so the highest value is $-9$.`,
    },
    {
      n: 12,
      skill: SYS,
      page: 9,
      stem: r`In the system of equations below, $a$ and $c$ are constants.

$$\begin{aligned}ax + y &= c\\ \tfrac{1}{2}x + \tfrac{1}{3}y &= \tfrac{1}{6}\end{aligned}$$

If the system of equations has an infinite number of solutions $(x, y)$, what is the value of $a$?`,
      grid: ["3/2"],
      explanation: r`Infinitely many solutions means the equations describe the same line.

Multiply the second equation by 3 so its $y$-coefficient is 1, matching the first: $\tfrac{3}{2}x + y = \tfrac{1}{2}$.

Comparing with $ax + y = c$ gives $a = \tfrac{3}{2} = 1.5$ (and $c = \tfrac{1}{2}$).`,
    },
    {
      n: 13,
      skill: L2,
      page: 9,
      stem: r`Lines $k$ and $l$ are perpendicular. If the point $(4, m)$ and $(9, m + 3)$ lies on line $k$ and line $k$ and $l$ intersect at $(9, m + 3)$, which of the following can lie on line $l$?`,
      choices: [r`$(m - 6,\ -4)$`, r`$(m + 9,\ 24)$`, r`$(21,\ m - 17)$`, r`$(24,\ m + 12)$`],
      answer: "C",
      explanation: r`Slope of $k$: $\dfrac{(m + 3) - m}{9 - 4} = \dfrac{3}{5}$. So line $l$ has slope $-\dfrac{5}{3}$ and passes through $(9, m + 3)$.

Check choice C, $(21, m - 17)$: slope from $(9, m + 3)$ is $\dfrac{(m - 17) - (m + 3)}{21 - 9} = \dfrac{-20}{12} = -\dfrac{5}{3}$. ✓

Choice D gives slope $\tfrac{9}{15} = \tfrac{3}{5}$, which is line $k$'s direction. Choices A and B depend on $m$, so they aren't on $l$ for every $m$.`,
    },
    {
      n: 14,
      skill: SYS,
      page: 9,
      stem: r`$$\begin{aligned}22x - 21y &= 43\\ 5x + 14y &= 59\end{aligned}$$

The solution to the given system of equations is $(x, y) = \left(\dfrac{p}{826}, \dfrac{w}{59}\right)$, where $p$ and $w$ are integers. What is the value of $p + w$?`,
      grid: ["3836"],
      flag: r`As printed, $y = \tfrac{1083}{413}$ can't be written as $\tfrac{w}{59}$ with an integer $w$. The book's key (3836) assumes $w = 154$.`,
      explanation: r`Eliminate $y$: multiply the first equation by 2 and the second by 3, then add.
$$44x - 42y = 86,\quad 15x + 42y = 177 \quad\Rightarrow\quad 59x = 263$$

So $x = \dfrac{263}{59} = \dfrac{3682}{826}$, which gives $p = 3682$.

Substituting back gives $y = \dfrac{1083}{413} = \dfrac{w}{59}$, so $w = \dfrac{1083}{7} \approx 154.7$. That isn't an integer, so the question has an error as printed. The book's answer, $3682 + 154 = 3836$, drops the decimal part.`,
    },
    {
      n: 15,
      skill: INEQ,
      page: 9,
      stem: r`3 consecutive even integers are ordered from smallest to largest. 5 times the first integer is at least 9 more than the sum of the second and third integers. What is the minimum possible value for the second integer?`,
      grid: ["8"],
      explanation: r`Let the integers be $n$, $n + 2$, $n + 4$ with $n$ even.
$$5n \ge (n + 2) + (n + 4) + 9 = 2n + 15 \quad\Rightarrow\quad 3n \ge 15 \quad\Rightarrow\quad n \ge 5$$

The smallest even $n$ is 6, so the smallest possible second integer is $6 + 2 = 8$.`,
    },
    {
      n: 16,
      skill: L2,
      page: 10,
      stem: r`| $x$ | $y$ |
|---|---|
| $-2s$ | $17$ |
| $-s$ | $14$ |
| $s$ | $8$ |

The table shows three values of $x$ and their corresponding values of $y$. There is a linear relationship between $x$ and $y$. Which of the following equations represents this relationship?`,
      choices: [r`$sx + 3y = 11s$`, r`$3x + sy = 11s$`, r`$3x + sy = 11$`, r`$sx + 3y = 11$`],
      answer: "B",
      explanation: r`Slope: $\dfrac{14 - 17}{-s - (-2s)} = -\dfrac{3}{s}$.

Using $(s, 8)$: $y - 8 = -\dfrac{3}{s}(x - s)$, so $y = -\dfrac{3}{s}x + 11$.

Multiply by $s$: $sy = -3x + 11s$, which is $3x + sy = 11s$.`,
    },
    {
      n: 17,
      skill: LF,
      page: 10,
      stem: r`A cooking school is offering a promotion where the first class is free, the second class is half off the regular price, and the remaining classes are regularly priced. If the regular price of a class is \$22.80, which function $f$ gives the total cost, in dollars, of $x$ classes taken using this promotion, where $x > 2$?`,
      choices: [
        r`$f(x) = 22.80(x - 1) + 11.40$`,
        r`$f(x) = 22.80(x - 2) + 11.40$`,
        r`$f(x) = 22.80(x - 1) + 11.40(x - 2)$`,
        r`$f(x) = 22.80(x - 2) + 11.40(x - 1)$`,
      ],
      answer: "B",
      explanation: r`Class 1 costs \$0. Class 2 costs half price, \$11.40. The remaining $x - 2$ classes cost \$22.80 each.

$f(x) = 0 + 11.40 + 22.80(x - 2)$, which is choice B.`,
    },
    {
      n: 18,
      skill: SYS,
      page: 10,
      stem: r`$$\begin{aligned}-32x + 18y + 150 &= 15y + 4x\\ 52 + \tfrac{w}{3}x + 18y &= -32\end{aligned}$$

In the given system of equations, $w$ is a constant. The system has only one solution. Find the value that $w$ is not equal to.`,
      grid: ["-648"],
      explanation: r`A system has exactly one solution when the slopes are different.

First equation: $3y = 36x - 150$, so $y = 12x - 50$. Slope 12.

Second equation: $18y = -\tfrac{w}{3}x - 84$, so $y = -\tfrac{w}{54}x - \tfrac{14}{3}$. Slope $-\tfrac{w}{54}$.

The slopes are equal when $-\tfrac{w}{54} = 12$, that is, when $w = -648$. So $w \neq -648$.`,
    },
    {
      n: 19,
      skill: SYS,
      page: 10,
      stem: r`$$\begin{aligned}5x + 8y &= 9\\ 15x + 24y &= 27\end{aligned}$$

For each real number $r$, which of the following points is on the graph of each equation in the $xy$-plane for the given system?`,
      choices: [
        r`$\left(r,\ -\dfrac{5r}{8} + \dfrac{9}{8}\right)$`,
        r`$\left(-\dfrac{5r}{8} + \dfrac{9}{8},\ r\right)$`,
        r`$\left(-\dfrac{5r}{8} + 9,\ \dfrac{5r}{8} + 27\right)$`,
        r`$\left(\dfrac{r}{3} + 9,\ -\dfrac{r}{3} + 27\right)$`,
      ],
      answer: "A",
      explanation: r`The second equation is 3 times the first, so both are the line $8y = 9 - 5x$, or $y = -\tfrac{5}{8}x + \tfrac{9}{8}$.

With $x = r$, the point is $\left(r,\ -\tfrac{5r}{8} + \tfrac{9}{8}\right)$.`,
    },
    {
      n: 20,
      skill: LF,
      page: 11,
      stem: r`A beekeeper's initial observation of the population of a certain bee colony was 1,100 bees. The beekeeper set a goal to increase the population to 2,600 bees. The beekeeper uses a model that predicts the population of this bee colony begins at 1,100 and increases by 120 bees per week in the first two weeks after the initial observation, and then increases by 180 bees per week until the beekeeper's goal is reached. According to this model, at the end of week $w$ after the initial observation, where $w > 2$, which of the following functions gives the predicted number of bees still needed to reach the beekeeper's goal?`,
      choices: [
        r`$p(w) = 2{,}600 - 180w$`,
        r`$p(w) = 2{,}480 + 180w$`,
        r`$p(w) = 1{,}620 - 180w$`,
        r`$p(w) = -120 + 180w$`,
      ],
      answer: "C",
      explanation: r`After 2 weeks the population is $1{,}100 + 2(120) = 1{,}340$. After week $w$ it is $1{,}340 + 180(w - 2) = 980 + 180w$.

Bees still needed: $2{,}600 - (980 + 180w) = 1{,}620 - 180w$.`,
    },
    {
      n: 21,
      skill: LF,
      page: 11,
      stem: r`During a specific 2-hour period of the day, the mean photosynthetic rate, $P(x)$, of a plant species increases at a constant rate in terms of the photochemical energy available, $x$. During this period, $P(300) = 9.8$, and the mean photosynthetic rate increases by 0.13 micromoles per meter squared per second ($\mu\text{mol}\cdot\text{m}^{-2}\cdot\text{s}^{-1}$) when the photochemical energy available increases by $5\ \mu\text{mol}\cdot\text{m}^{-2}\cdot\text{s}^{-1}$. Which equation gives the mean photosynthetic rate, in $\mu\text{mol}\cdot\text{m}^{-2}\cdot\text{s}^{-1}$, in terms of the photochemical energy available, in $\mu\text{mol}\cdot\text{m}^{-2}\cdot\text{s}^{-1}$, during this period?`,
      choices: [
        r`$P(x) = 0.026x + 9.8$`,
        r`$P(x) = 0.026x + 2$`,
        r`$P(x) = 9.8x + 0.026$`,
        r`$P(x) = 9.8x - 2{,}930.2$`,
      ],
      answer: "B",
      explanation: r`Slope: $\dfrac{0.13}{5} = 0.026$.

Use $P(300) = 9.8$: $9.8 = 0.026(300) + b = 7.8 + b$, so $b = 2$.

$P(x) = 0.026x + 2$.`,
    },
    {
      n: 22,
      skill: LF,
      page: 11,
      stem: r`| $x$ | $g(x)$ |
|---|---|
| $-27$ | $3$ |
| $-9$ | $0$ |
| $21$ | $5$ |

The table shows three values of $x$ and their corresponding values of $g(x)$, where $g(x) = \dfrac{f(x)}{x + 3}$ and $f$ is a linear function. What is the $y$-intercept of the graph of $y = f(x)$ in the $xy$-plane?`,
      choices: [r`$(0, 36)$`, r`$(0, 12)$`, r`$(0, 4)$`, r`$(0, -9)$`],
      answer: "A",
      explanation: r`Since $f(x) = g(x)\,(x + 3)$:
- $f(-27) = 3(-24) = -72$
- $f(-9) = 0$
- $f(21) = 5(24) = 120$

Slope: $\dfrac{0 - (-72)}{-9 - (-27)} = \dfrac{72}{18} = 4$. With the zero at $x = -9$, $f(x) = 4(x + 9) = 4x + 36$. Check: $f(21) = 120$ ✓.

The $y$-intercept is $(0, 36)$.`,
    },
    {
      n: 23,
      skill: L2,
      page: 11,
      stem: r`| $x$ | $y$ |
|---|---|
| $-7$ | $d + 3$ |
| $-4$ | $4k + 6d$ |
| $1 - 3d$ | $8$ |

The table shows three values of $x$ and their corresponding values of $y$ for the linear relationship between $x$ and $y$. The $x$-intercept of the line occurs when $x = -4$. The number $d$ is a negative constant. The number $k$ is a constant. What is the value of $dk$?`,
      grid: ["-169/6"],
      explanation: r`The $x$-intercept is at $x = -4$, so $4k + 6d = 0$, which gives $k = -\tfrac{3}{2}d$.

The slope from $(-4, 0)$ must be the same to both other points:
$$\frac{d + 3}{-7 - (-4)} = \frac{8}{(1 - 3d) - (-4)} \quad\Rightarrow\quad -\frac{d + 3}{3} = \frac{8}{5 - 3d}$$

Cross-multiply: $-(d + 3)(5 - 3d) = 24$, which simplifies to $3d^2 + 4d - 39 = 0$, so $(3d + 13)(d - 3) = 0$.

$d$ is negative, so $d = -\tfrac{13}{3}$ and $k = \tfrac{13}{2}$. Then $dk = -\dfrac{169}{6} \approx -28.17$.`,
    },
    {
      n: 24,
      skill: L2,
      page: 11,
      stem: r`Line $s$ is defined by $x - 4y = 24$. Line $t$ is perpendicular to line $s$ in the $xy$-plane and passes through the points $(k, 0)$ and $(60, -k)$. What is the value of $k$?`,
      grid: ["48"],
      explanation: r`Line $s$: $y = \tfrac{1}{4}x - 6$, slope $\tfrac{1}{4}$. Line $t$ has slope $-4$.
$$\frac{-k - 0}{60 - k} = -4 \quad\Rightarrow\quad -k = -240 + 4k \quad\Rightarrow\quad k = 48$$`,
    },
    {
      n: 25,
      skill: LF,
      page: 12,
      stem: r`$$t = \frac{1}{2}v$$

For the equation above, which of the following is the graph of $v$ as a function of $t$?`,
      choices: [fig("alg-25-a", 260), fig("alg-25-b", 260), fig("alg-25-c", 260), fig("alg-25-d", 260)],
      answer: "A",
      explanation: r`Solve for $v$: $v = 2t$. That is a line through the origin with slope 2, so it reaches $v = 10$ at $t = 5$.

Graph A goes from $(0, 0)$ to $(5, 10)$. Graph B has slope $\tfrac{1}{2}$ (that's $t$ as a function of $v$), C has slope 1, and D has slope 3.`,
    },
    {
      n: 26,
      skill: L2,
      page: 12,
      stem: r`| $x$ | $y$ |
|---|---|
| $0$ | $n$ |
| $4$ | $n + 21$ |
| $8$ | $n + 42$ |

There is a linear relationship between $x$ and $y$. The table shows three values of $x$ and their corresponding values of $y$ in terms of a constant $n$. What is the slope of the line in the $xy$-plane that represents this relationship?`,
      choices: [r`$21$`, r`$2$`, r`$\dfrac{21}{4}$`, r`$\dfrac{4}{21}$`],
      answer: "C",
      explanation: r`Slope $= \dfrac{(n + 21) - n}{4 - 0} = \dfrac{21}{4}$.`,
    },
    {
      n: 27,
      skill: L2,
      page: 12,
      stem: r`In the $xy$-plane, line $r$ passes through the points $(3, 12)$ and $(7, 13)$. Line $s$ passes through the point $(1, 2)$ and is perpendicular to line $r$. An equation of line $s$ is $ax + 7y = c$, where $a$ and $c$ are constants. What is the value of $c$?`,
      grid: ["42"],
      explanation: r`Slope of $r$: $\dfrac{13 - 12}{7 - 3} = \dfrac{1}{4}$, so line $s$ has slope $-4$.

The slope of $ax + 7y = c$ is $-\dfrac{a}{7}$. Setting $-\dfrac{a}{7} = -4$ gives $a = 28$.

Line $s$ passes through $(1, 2)$: $c = 28(1) + 7(2) = 42$.`,
    },
    {
      n: 28,
      skill: L2,
      page: 13,
      stem: r`| Number of cars | Max passengers/crew |
|---|---|
| 2 | 102 |
| 6 | 294 |
| 10 | 486 |

The table shows the linear relationship between the number of cars, $c$, on a commuter train and the maximum number of passengers and crew, $p$, that the train can carry. Which equation represents the linear relationship between $c$ and $p$?`,
      choices: [r`$48p - c = -6$`, r`$48c - p = 6$`, r`$48p - c = 6$`, r`$48c - p = -6$`],
      answer: "D",
      explanation: r`Slope: $\dfrac{294 - 102}{6 - 2} = 48$. Then $p = 48c + b$ with $102 = 96 + b$, so $b = 6$.

$p = 48c + 6$ rearranges to $48c - p = -6$.`,
    },
    {
      n: 29,
      skill: SYS,
      page: 13,
      stem: r`$$7x + 8y = 3$$

The given equation is one equation in a system of two linear equations. If the system of equations has at least one solution, which of the following equations could be the other equation in the system?

I. $14x + 16y = 12$
II. $14x + 16y = 6$`,
      choices: [r`I only`, r`II only`, r`I and II`, r`Neither I nor II`],
      answer: "B",
      explanation: r`Divide each option by 2:
- I: $7x + 8y = 6$. Parallel to $7x + 8y = 3$ with a different constant, so no solution.
- II: $7x + 8y = 3$. Same line, so infinitely many solutions.

Only II works.`,
    },
    {
      n: 30,
      skill: L1,
      page: 13,
      stem: r`$$a(4 - x) = 28 - 7x$$

In the given equation, $a$ is a constant. The equation has exactly one solution. Which of the following CANNOT be the value of $a$?`,
      choices: [r`$1$`, r`$4$`, r`$7$`, r`$28$`],
      answer: "C",
      explanation: r`Rearrange: $4a - ax = 28 - 7x$, so $(7 - a)x = 28 - 4a$.

This has exactly one solution unless the $x$-coefficient is zero. When $a = 7$ the equation becomes $0 = 0$, which has infinitely many solutions. So $a$ can't be 7.`,
    },
    {
      n: 31,
      skill: L2,
      page: 13,
      stem: r`$$\frac{x}{7} + \frac{y}{5} = \frac{41}{35}$$

An engineer connects resistors in series, where the resistors in the series have a total resistance of $\frac{41}{35}$ ohms. In this series, there are $x$ resistors of type A, which each have a resistance of $a$ ohms, and $y$ resistors of type B, which each have a resistance of $b$ ohms. The given equation represents this situation. According to this equation, what is the positive difference between the value of $a$ and the value of $b$?`,
      choices: [r`$\dfrac{1}{35}$`, r`$\dfrac{2}{35}$`, r`$\dfrac{3}{35}$`, r`$\dfrac{12}{35}$`],
      answer: "B",
      explanation: r`The total resistance is $ax + by$. Matching it with $\tfrac{1}{7}x + \tfrac{1}{5}y$ gives $a = \tfrac{1}{7}$ and $b = \tfrac{1}{5}$.

Positive difference: $\tfrac{1}{5} - \tfrac{1}{7} = \tfrac{7 - 5}{35} = \tfrac{2}{35}$.

Note: the book's answer key says D ($\tfrac{12}{35}$). That is $a + b$, not the difference.`,
    },
    {
      n: 32,
      skill: LF,
      page: 14,
      stem: r`A company is considering placing an advertisement on Website R. Website R charges no initial fee, but charges the same amount as Website P every time the advertisement is clicked. Website P charges an initial fee of \$10 plus \$0.20 each time the advertisement is clicked. Which of the following graphs represents the cost $y$, in dollars, of placing an advertisement that receives $x$ clicks on Website R?`,
      choices: [fig("alg-32-a", 280), fig("alg-32-b", 280), fig("alg-32-c", 280), fig("alg-32-d", 280)],
      answer: "A",
      explanation: r`Website R: no initial fee and \$0.20 per click, so $y = 0.2x$. That's a line through the origin reaching $y = 24$ at $x = 120$: graph A.

Graph B is Website P (it starts at \$10). C has slope 0.4 and D has slope 0.15.

(The book leaves out Website P's pricing. It was added here from graph B, which matches the book's answer A.)`,
    },
    {
      n: 33,
      skill: L1,
      page: 14,
      stem: r`$$j(x - k) = \frac{3}{4}x + 15$$

In the equation above, $j$ and $k$ are constants. If the equation has infinitely many solutions for $x$, what is the value of $k$?`,
      grid: ["-20"],
      explanation: r`Expand: $jx - jk = \tfrac{3}{4}x + 15$. Infinitely many solutions means both sides are identical, so $j = \tfrac{3}{4}$ and $-jk = 15$.

$-\tfrac{3}{4}k = 15$, so $k = -20$.`,
    },
    {
      n: 34,
      skill: L2,
      page: 14,
      stem: r`${fig("alg-34", 300)}

Line segment $GH$ and point $R$ are shown in the $xy$-plane. If line $\ell$ (not shown) contains point $R$ and is perpendicular to line segment $GH$, which of the following is an equation of line $\ell$?`,
      choices: [r`$-4x + 3y = 6$`, r`$-3x + 4y = 8$`, r`$3x + 4y = 8$`, r`$4x + 3y = 6$`],
      answer: "A",
      explanation: r`From the graph, $G = (0, 3)$ and $H = (4, 0)$, so the slope of $GH$ is $-\tfrac{3}{4}$. Line $\ell$ has slope $\tfrac{4}{3}$.

$R = (0, 2)$ is the $y$-intercept: $y = \tfrac{4}{3}x + 2$. Multiply by 3: $3y = 4x + 6$, which is $-4x + 3y = 6$.`,
    },
    {
      n: 35,
      skill: LF,
      page: 15,
      stem: r`During the first 5.00 seconds after a car started moving, its speed increased to 12.0 meters per second. From 5.00 seconds to 13.0 seconds after the car started moving, its speed increased from 12.0 meters per second to 25.0 meters per second. To the nearest hundredth, what is the positive difference between the average rate of change of the speed of the car, in meters per second per second, during the first 5.00 seconds after the car started moving and the average rate of change of the speed of the car, in meters per second per second, from 5.00 seconds to 13.0 seconds after the car started moving?`,
      grid: ["0.78"],
      explanation: r`First 5 seconds (starting from rest): $\dfrac{12.0 - 0}{5.00} = 2.4$ m/s².

From 5 to 13 seconds: $\dfrac{25.0 - 12.0}{13.0 - 5.00} = \dfrac{13}{8} = 1.625$ m/s².

Difference: $2.4 - 1.625 = 0.775$, which rounds to $0.78$.`,
    },
    {
      n: 36,
      skill: SYS,
      page: 15,
      stem: r`$$\begin{aligned}7kx + 13my &= 20.5\\ 6kx + 5my &= -48\end{aligned}$$

In the given system of equations, $k$ and $m$ are constants. The system has a solution of $(2, y)$. What is the value of $k$?`,
      grid: ["-1453/172"],
      explanation: r`Substitute $x = 2$ and let $u = my$:
$$14k + 13u = 20.5,\qquad 12k + 5u = -48$$

Eliminate $u$: multiply the first by 5 and the second by 13.
$$70k + 65u = 102.5,\qquad 156k + 65u = -624$$

Subtract: $-86k = 726.5$, so $k = -\dfrac{1453}{172} \approx -8.4477$. Enter $-8.447$ or $-8.448$.`,
    },
    {
      n: 37,
      skill: LF,
      page: 15,
      stem: r`${fig("alg-37", 320)}

The graph shows the total amount of rainfall $y$, in centimeters, from the start of a 10-hour period, where $x$ is the number of hours after the start of the period. Which of the following statements about the rainfall during this time period is true?`,
      choices: [
        r`The rate of rainfall was 2 centimeters per hour between $x = 2$ and $x = 4$.`,
        r`The rate of rainfall was the greatest between $x = 4$ and $x = 10$.`,
        r`The rate of rainfall increased between $x = 0$ and $x = 2$.`,
        r`The rate of rainfall was 0 centimeters per hour between $x = 2$ and $x = 4$.`,
      ],
      answer: "D",
      explanation: r`The rate of rainfall is the slope of the graph.

From $x = 2$ to $x = 4$ the graph is flat at $y = 2$, so the rate was 0 cm per hour (D is true and A is false).

From 0 to 2 the slope is a constant 1 cm/h, so the rate didn't increase (C is false). From 4 to 10 the slope is $0.6/6 = 0.1$ cm/h, less than 1 (B is false).`,
    },
  ],
});
