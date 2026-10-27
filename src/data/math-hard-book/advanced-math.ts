import { defineChapter, type Draft } from "../define";

const r = String.raw;
const NF = "Nonlinear functions";
const NE = "Nonlinear equations in one variable and systems of equations in two variables";
const EQ = "Equivalent expressions";
const fig = (name: string, w = 300) => `![graph](/figures/mhb/${name}.png){w=${w}}`;

const questions: Draft[] = [
  {
    n: 1,
    skill: NF,
    page: 18,
    stem: r`In the $xy$-plane, the quadrants are labeled as shown. The graph of the equation

$$y = 3(x + a)^2 + b$$

where $a$ and $b$ are positive constants, has a vertex in which quadrant?

${fig("adv-1", 260)}`,
    choices: [r`Quadrant I`, r`Quadrant II`, r`Quadrant III`, r`Quadrant IV`],
    answer: "B",
    explanation: r`In vertex form $y = 3(x - h)^2 + k$ the vertex is $(h, k)$. Here $y = 3(x - (-a))^2 + b$, so the vertex is $(-a, b)$.

$a > 0$ makes the $x$-coordinate negative and $b > 0$ makes the $y$-coordinate positive: Quadrant II.`,
  },
  {
    n: 2,
    skill: NE,
    page: 18,
    stem: r`The solutions to $x^2 + 12x + 35 = 0$ are $r$ and $s$, where $r < s$. The solutions to $x^2 + 12x + 27 = 0$ are $t$ and $u$, where $t < u$. The solutions to $x^2 + 24x + c = 0$, where $c$ is a constant, are $r + u$ and $s + t$. What is the value of $c$?`,
    grid: ["140"],
    explanation: r`$x^2 + 12x + 35 = (x + 7)(x + 5)$, so $r = -7$, $s = -5$.

$x^2 + 12x + 27 = (x + 9)(x + 3)$, so $t = -9$, $u = -3$.

The roots of the third equation are $r + u = -10$ and $s + t = -14$. (Check: their sum is $-24$ ✓.) The constant term is the product of the roots: $c = (-10)(-14) = 140$.`,
  },
  {
    n: 3,
    skill: NE,
    page: 18,
    stem: r`If $x = \sqrt[2n]{2x^n + 35}$, where $n$ is a positive integer constant, what is the value of $x^n$?`,
    grid: ["7"],
    explanation: r`Raise both sides to the power $2n$: $x^{2n} = 2x^n + 35$.

Let $y = x^n$: $y^2 - 2y - 35 = 0$, so $(y - 7)(y + 5) = 0$.

$x$ equals an even root, so $x \ge 0$ and $x^n \ge 0$. That rules out $-5$, so $x^n = 7$.`,
  },
  {
    n: 4,
    skill: NF,
    page: 18,
    stem: r`${fig("adv-4", 260)}

The graph of $y = f(x)$ is shown in the $xy$-plane. If $a$, $b$, and $c$ are positive constants, which of the following equations could define the function $f$?`,
    choices: [
      r`$f(x) = -a(x + b)(x + c)$`,
      r`$f(x) = -a(x - b)(x - c)$`,
      r`$f(x) = a(x + b)(x + c)$`,
      r`$f(x) = a(x - b)(x - c)$`,
    ],
    answer: "C",
    explanation: r`The parabola opens upward, so the leading coefficient is positive: C or D.

Both $x$-intercepts are left of the origin (negative). $a(x + b)(x + c)$ has zeros $-b$ and $-c$, which are negative because $b, c > 0$. So the answer is C.`,
  },
  {
    n: 5,
    skill: NF,
    page: 18,
    stem: r`The function $f$ is defined by $f(x) = \dfrac{\lvert x \rvert}{a}$, where $a < 0$. What is the product of $f(17a)$ and $f(8a)$?`,
    grid: ["136"],
    explanation: r`Since $a < 0$, $\lvert 17a \rvert = -17a$, so $f(17a) = \dfrac{-17a}{a} = -17$. Likewise $f(8a) = -8$.

Product: $(-17)(-8) = 136$.`,
  },
  {
    n: 7,
    skill: NF,
    page: 19,
    stem: r`${fig("adv-7", 280)}

The graph of $y = g(x)$ is shown, where the function $g$ is defined by

$$g(x) = f(x + a) + b$$

and $a$ and $b$ are constants. If the function $f$ is defined by $f(x) = x^3$, what is the value of $a + b$?`,
    choices: [r`$-5$`, r`$-1$`, r`$1$`, r`$5$`],
    answer: "A",
    explanation: r`$y = x^3$ has its flat "center" at $(0, 0)$. In the graph, the center moved to $(4, -1)$: 4 right and 1 down.

So $g(x) = (x - 4)^3 - 1$, which means $a = -4$ and $b = -1$. Check: $g(5) = 1 - 1 = 0$ ✓.

$a + b = -5$.`,
  },
  {
    n: 8,
    skill: NE,
    page: 19,
    stem: r`$$(3x + p)(5x^2 - 45)(2x^2 - 16x + 6p) = 0$$

In the given equation, $p$ is a positive constant. The sum of the solutions to the equation is $\frac{20}{3}$. What is the value of $p$?`,
    grid: ["4"],
    explanation: r`Solutions from each factor:
- $3x + p = 0$ gives $x = -\tfrac{p}{3}$.
- $5x^2 = 45$ gives $x = \pm 3$, which sum to 0.
- $2x^2 - 16x + 6p = 0$ has roots summing to $\tfrac{16}{2} = 8$.

$-\tfrac{p}{3} + 0 + 8 = \tfrac{20}{3}$, so $\tfrac{p}{3} = \tfrac{4}{3}$ and $p = 4$. (Then the last factor's roots are 2 and 6, all distinct.)`,
  },
  {
    n: 9,
    skill: NF,
    page: 19,
    stem: r`$$f(x) = ax^2 + 6x + c$$

In the given quadratic function, $a$ and $c$ are constants. The graph of $y = f(x)$ in the $xy$-plane is a parabola that opens upward and has a vertex at the point $(h, k)$, where $h$ and $k$ are constants. If $k > 0$ and $f(-7) = f(5)$, which of the following must be true?

I. $c > 3$
II. $a > 3$`,
    choices: [r`I only`, r`II only`, r`I and II`, r`Neither I nor II`],
    answer: "A",
    explanation: r`$f(-7) = f(5)$ means the axis of symmetry is halfway between them: $h = -1$.

$h = -\dfrac{6}{2a} = -\dfrac{3}{a} = -1$, so $a = 3$. II ($a > 3$) is false.

$k = f(-1) = 3 - 6 + c = c - 3 > 0$, so $c > 3$. I is true.`,
  },
  {
    n: 10,
    skill: NF,
    page: 19,
    stem: r`Function $f$ is a quadratic function. The graph of $y = f(x)$ in the $xy$-plane has a vertex at $(9, -7)$, contains the point $(8, -9)$, and has a $y$-intercept at $(0, a)$. The graph of $y = 6 \cdot f(x)$ has a $y$-intercept at $(0, b)$. What is the positive difference between $a$ and $b$?`,
    grid: ["845"],
    explanation: r`$f(x) = k(x - 9)^2 - 7$. Using $(8, -9)$: $k - 7 = -9$, so $k = -2$.

$a = f(0) = -2(81) - 7 = -169$ and $b = 6a = -1014$.

Positive difference: $-169 - (-1014) = 845$.`,
  },
  {
    n: 11,
    skill: NF,
    page: 20,
    stem: r`${fig("adv-11", 280)}

The graph of $y = f(x)$ is shown in the $xy$-plane. If the function $g$ is defined by

$$g(x) = (x + 3)(x - 1)$$

for which of the following values of $x$ is $f(x) > g(x)$?`,
    choices: [r`$-3$`, r`$-2$`, r`$1$`, r`$2$`],
    answer: "B",
    flag: r`As printed, $f(x) > g(x)$ holds for $x = -3$, $-2$, and $1$, so choices A, B and C all work. The book's key is B.`,
    explanation: r`From the graph: $f(-3) \approx 2$, $f(-2) \approx 5$, $f(1) \approx 2$, $f(2) \approx -3$.

From the formula: $g(-3) = 0$, $g(-2) = -3$, $g(1) = 0$, $g(2) = 5$.

$f > g$ at $x = -2$ (5 > −3), the book's answer. But it also holds at $x = -3$ and $x = 1$ ($2 > 0$), so as printed the question has more than one correct choice.`,
  },
  {
    n: 12,
    skill: EQ,
    page: 20,
    stem: r`$$34z^{14} + bz^7 + 70$$

In the given expression, $b$ is a positive integer. If $qz^7 + r$ is a factor of the expression, where $q$ and $r$ are positive integers, what is the highest possible value of $b$?`,
    grid: ["2381"],
    explanation: r`Let $u = z^7$. Then $34u^2 + bu + 70 = (qu + r)(su + t)$ with $qs = 34$ and $rt = 70$, all positive integers, and $b = qt + rs$.

To make $b$ as large as possible, pair the big numbers: $q = 34$, $s = 1$, $r = 1$, $t = 70$.

$b = 34 \cdot 70 + 1 \cdot 1 = 2381$, from $(34z^7 + 1)(z^7 + 70)$.`,
  },
  {
    n: 13,
    skill: NF,
    page: 20,
    stem: r`${fig("adv-13", 280)}

Which of the following could be the equation of the graph shown?`,
    choices: [
      r`$y = (x + 2)^2(x - 3)^2$`,
      r`$y = (x - 2)^2(x + 3)^2$`,
      r`$y = 2(x + 2)^2(x - 3)^2$`,
      r`$y = 2(x - 2)^2(x + 3)^2$`,
    ],
    answer: "C",
    explanation: r`The graph touches the $x$-axis at $x = -2$ and $x = 3$, so it has factors $(x + 2)^2(x - 3)^2$. That leaves A or C.

Check the local maximum near $x = 0.5$, about 78: $(2.5)^2(2.5)^2 \approx 39$, so the factor is 2. Also $y(0) = k \cdot 4 \cdot 9 = 36k$, and the graph shows about 72, so $k = 2$.`,
  },
  {
    n: 14,
    skill: NF,
    page: 21,
    stem: r`${fig("adv-14", 280)}

An equation for the graph shown is

$$y = a(x + 3)(x + b)$$

where $a$ and $b$ are constants. What is the value of $ab$?`,
    choices: [r`$-2$`, r`$-\dfrac{4}{3}$`, r`$\dfrac{1}{2}$`, r`$8$`],
    answer: "B",
    explanation: r`The graph crosses the $x$-axis at $-3$ and $4$, so $x + b = x - 4$ and $b = -4$.

The $y$-intercept is $-4$: $a(3)(-4) = -4$, so $a = \tfrac{1}{3}$.

$ab = \tfrac{1}{3}(-4) = -\tfrac{4}{3}$.`,
  },
  {
    n: 15,
    skill: NF,
    page: 21,
    stem: r`The function $f$ is defined by $f(x) = -a^x + b$, where $a$ and $b$ are constants. In the $xy$-plane, the graph of $y = f(x) - 12$ has a $y$-intercept at $\left(0, -\frac{75}{7}\right)$. The product of $a$ and $b$ is 320. What is the value of $a$?`,
    grid: ["140"],
    explanation: r`At $x = 0$: $f(0) - 12 = -1 + b - 12 = b - 13$.

$b - 13 = -\tfrac{75}{7}$, so $b = \tfrac{16}{7}$.

$ab = 320$, so $a = 320 \cdot \tfrac{7}{16} = 140$.`,
  },
  {
    n: 16,
    skill: NF,
    page: 21,
    stem: r`${fig("adv-16", 260)}

The graph of $f(x)$ is the result of shifting the graph of $g(x)$ 3 units to the right and 3 units up. If the equation of $f(x)$ is

$$f(x) = x^2 + 4x$$

what is the equation of $g(x)$?`,
    choices: [r`$(x - 5)^2 + 1$`, r`$(x - 5)^2 - 7$`, r`$(x + 5)^2 - 7$`, r`$(x + 5)^2 - 4$`],
    answer: "C",
    explanation: r`$f(x) = (x + 2)^2 - 4$, vertex $(-2, -4)$.

$f$ is $g$ moved 3 right and 3 up, so $g$ is $f$ moved 3 left and 3 down: vertex $(-5, -7)$.

$g(x) = (x + 5)^2 - 7$.`,
  },
  {
    n: 17,
    skill: NE,
    page: 21,
    stem: r`${fig("adv-17", 280)}

The $xy$-plane above shows two points of intersection of the graphs of a linear function and a quadratic function. The vertex of the graph of the quadratic function is at $(3, -4)$ and $(r, s)$ is one of the points of intersection of the graphs. What is the value of $r$?`,
    grid: ["9/2"],
    explanation: r`The line passes through $(0, -6)$ and $(3, -4)$: slope $\tfrac{2}{3}$, so $y = \tfrac{2}{3}x - 6$, or $y = \tfrac{2}{3}(x - 3) - 4$.

The parabola is $y = k(x - 3)^2 - 4$. It meets the $x$-axis at $x = 6$ (twice as far from the origin as the tick at 3), so $9k = 4$ and $k = \tfrac{4}{9}$.

Set them equal: $\tfrac{4}{9}(x - 3)^2 = \tfrac{2}{3}(x - 3)$. Besides $x = 3$, this gives $x - 3 = \tfrac{3}{2}$, so $r = 4.5$.`,
  },
  {
    n: 18,
    skill: NF,
    page: 22,
    stem: r`${fig("adv-18", 280)}

The graph of

$$y = f(x) - k$$

is shown in the $xy$-plane. If $k$, $a$, and $b$ are positive constants, which equation could define $f$?`,
    choices: [
      r`$f(x) = (x - a)^2(x + b)$`,
      r`$f(x) = (x + a)^2(x - b)$`,
      r`$f(x) = (x - a)^2(x + b)^2$`,
      r`$f(x) = (x + a)^2(x - b)^2$`,
    ],
    answer: "D",
    explanation: r`The graph is a "W": both ends go up, so $f$ has even degree with a positive leading coefficient. That rules out the cubics A and B.

$y = f(x) - k$ is $f$ shifted down by $k$. A product of squares like $(x + a)^2(x - b)^2$ touches zero at its two minimums; shifted down, both minimums sit at $-k$, as in the graph.

The minimums are at a negative $x$ (about $-2$) and a positive $x$ (about 5), so the factors are $(x + a)^2$ and $(x - b)^2$ with $a, b > 0$: choice D.`,
  },
  {
    n: 19,
    skill: NF,
    page: 22,
    stem: r`$$f(x) = m\sqrt{-x - n}$$

where $m$ and $n$ are constants. If $f(8) = 0$ and $f(4) < -16$, which of the following must be true?`,
    choices: [r`$m > -8$`, r`$n + m = 0$`, r`$n + m > 0$`, r`$n - m > 0$`],
    answer: "D",
    explanation: r`$f(8) = 0$ gives $\sqrt{-8 - n} = 0$, so $n = -8$. (The case $m = 0$ is ruled out by $f(4) < -16$.)

$f(4) = m\sqrt{-4 + 8} = 2m < -16$, so $m < -8$.

Then $n - m = -8 - m > 0$ because $-m > 8$. Choice D.`,
  },
  {
    n: 20,
    skill: NF,
    page: 22,
    stem: r`For the function $f$, for every increase in $\frac{1}{2}$ in the value of $x$, the value of $f(x)$ increases by a factor of $c$, where $c$ is a constant. Which of the following equivalent forms of the function $f$ displays the value of $c$ as the base or the coefficient?`,
    choices: [
      r`$f(x) = 38(2)^{6x}$`,
      r`$f(x) = 38(8)^{2x}$`,
      r`$f(x) = 38(64)^{x}$`,
      r`$f(x) = 38(4{,}096)^{\frac{x}{2}}$`,
    ],
    answer: "B",
    explanation: r`Growing by a factor of $c$ every $\tfrac{1}{2}$ unit means $f(x) = A \cdot c^{2x}$ (the exponent goes up by 1 when $x$ goes up by $\tfrac{1}{2}$).

All four forms equal $38 \cdot 2^{6x}$. Increasing $x$ by $\tfrac{1}{2}$ multiplies by $2^3 = 8$, so $c = 8$.

$38(8)^{2x}$ shows 8 as the base. Choice B.`,
  },
  {
    n: 21,
    skill: NE,
    page: 22,
    stem: r`$$8rx^2 - 80sx + 8r = 0$$

For the given equation, $r$ and $s$ are constants such that $r > 0$, $s < 0$ and $\frac{r}{s} > k$. What is the least value of $k$ that ensures that the equation has two distinct real solutions?`,
    grid: ["-5"],
    explanation: r`Two distinct real solutions need a positive discriminant:
$$(80s)^2 - 4(8r)(8r) > 0 \;\Rightarrow\; 6400s^2 > 256r^2 \;\Rightarrow\; \frac{r^2}{s^2} < 25$$

So $-5 < \tfrac{r}{s} < 5$. Since $r > 0 > s$, the ratio is negative: $-5 < \tfrac{r}{s} < 0$.

The condition $\tfrac{r}{s} > k$ guarantees this only if $k \ge -5$. The least such $k$ is $-5$.`,
  },
  {
    n: 22,
    skill: NF,
    page: 22,
    stem: r`For the function $f$, for each increase in the value of $x$ by $c$, where $c$ is a positive constant, the value of $f(x)$ increases by a factor of 16. Which of the following equivalent forms of the function $f$ displays $\frac{1}{c}$ as a coefficient of $x$?`,
    choices: [
      r`$f(x) = 139\left(16^{\frac{1}{3}}\right)^{\frac{1}{2}x}$`,
      r`$f(x) = 139(8)^{2x}$`,
      r`$f(x) = 139\left(8^{2}\right)^{\frac{1}{2}x}$`,
      r`$f(x) = 139\left(64^{\frac{2}{3}}\right)^{\frac{1}{8}x}$`,
    ],
    answer: "D",
    flag: r`As printed, the four choices aren't equivalent to each other. Only D displays $\tfrac{1}{c}$; the book's key says B.`,
    explanation: r`A function that grows by a factor of 16 every $c$ units has the form $f(x) = A \cdot 16^{\frac{1}{c}x}$. So look for base 16 with coefficient $\tfrac{1}{c}$ on $x$.

D: $64^{\frac{2}{3}} = (4^3)^{\frac{2}{3}} = 16$, so $f(x) = 139 \cdot 16^{\frac{1}{8}x}$. It multiplies by 16 every 8 units, so $c = 8$ and the coefficient $\tfrac{1}{8}$ is $\tfrac{1}{c}$. ✓

B: $8^{2x} = 16^{\frac{3}{2}x}$, so $c = \tfrac{2}{3}$ and $\tfrac{1}{c} = \tfrac{3}{2}$, but the coefficient shown is 2. A and C fail the same way.

Note: as printed, the four choices aren't actually equivalent. The book's key says B.`,
  },
  {
    n: 23,
    skill: NF,
    page: 23,
    stem: r`$$f(x) = 250(5)^x$$

The function $f$ is defined by the given equation. If $g(x) = f(x - 2)$, which of the following equations defines the function $g$?`,
    choices: [r`$g(x) = 10(5)^x$`, r`$g(x) = 125(5)^x$`, r`$g(x) = 250(25)^x$`, r`$g(x) = 250(10)^x$`],
    answer: "A",
    explanation: r`$g(x) = 250(5)^{x - 2} = 250 \cdot \dfrac{5^x}{25} = 10(5)^x$.`,
  },
  {
    n: 24,
    skill: NF,
    page: 23,
    stem: r`The functions $f$ and $g$ are defined by the given equations, where $x \ge 0$. Which of the following equations displays, as a constant or coefficient, the maximum value of the function it defines, where $x \ge 0$?

I. $f(x) = 16(1.24)^x + 43$
II. $g(x) = 8(0.72)^x$`,
    choices: [r`I only`, r`II only`, r`I and II`, r`Neither I nor II`],
    answer: "B",
    explanation: r`I: base $1.24 > 1$, so $f$ keeps increasing and has no maximum for $x \ge 0$.

II: base $0.72 < 1$, so $g$ decreases. Its maximum is at $x = 0$: $g(0) = 8$, which is the coefficient shown.

II only.`,
  },
  {
    n: 25,
    skill: NF,
    page: 23,
    stem: r`$$z(w) = (0.829)^{2w}$$

The function $z$ is defined by the equation shown. The value of $z(w)$ decreases by $p\%$ for each increase by 1 in the value of $w$. To the nearest whole number, what is the value of $p$?`,
    grid: ["31"],
    explanation: r`$z(w) = (0.829^2)^w = (0.687241)^w$. Each increase of 1 in $w$ multiplies $z$ by $0.687$, a decrease of $1 - 0.687 = 0.313$, or about 31%.

(The book asks "which of the following is closest" but prints no choices, so it's a grid-in here.)`,
  },
  {
    n: 26,
    skill: NE,
    page: 23,
    stem: r`$$(x - k)^2 = (k - 5a)(x - k)$$

In the given equation, $a$ and $k$ are constants, where $k > 5a$. The sum of the solutions to the equation is $3k + 32$. What is the value of $a$?`,
    grid: ["-32/5"],
    explanation: r`Move everything to one side and factor out $(x - k)$:
$$(x - k)\big[(x - k) - (k - 5a)\big] = 0$$

The solutions are $x = k$ and $x = 2k - 5a$. Their sum is $3k - 5a = 3k + 32$, so $a = -\tfrac{32}{5} = -6.4$.`,
  },
  {
    n: 27,
    skill: EQ,
    page: 23,
    stem: r`The expression $6x^4 + 17x^2 + 7$ can be rewritten as $(3x^2 + a)(2x^2 + b)$, where $a$ and $b$ are positive integers, or as $(3x^2 + c)(2x^2 + d)$, where $c$ and $d$ are positive nonintegers. What is the value of $a + c$?`,
    grid: ["17/2"],
    explanation: r`Expanding $(3x^2 + a)(2x^2 + b)$ gives $3b + 2a = 17$ and $ab = 7$.

Integers: $a = 7$, $b = 1$ (check: $3 + 14 = 17$ ✓).

Nonintegers: $2c + 3d = 17$ and $cd = 7$. Substituting $c = \tfrac{17 - 3d}{2}$ gives $3d^2 - 17d + 14 = 0$, so $d = 1$ or $d = \tfrac{14}{3}$. The noninteger solution is $d = \tfrac{14}{3}$, $c = \tfrac{3}{2}$.

$a + c = 7 + \tfrac{3}{2} = 8.5$.`,
  },
  {
    n: 28,
    skill: NF,
    page: 23,
    stem: r`The function $f$ is defined by $f(x) = \dfrac{x^2 + ax + b}{2x + c}$, where $a$, $b$, and $c$ are constants. The graph of the function $f$ in the $xy$-plane, where $y = f(x)$, does not intersect the line $x = 4$. If $f(5) = f(6) = 0$, what is the value of $a + b + c$?`,
    grid: ["11"],
    explanation: r`The graph misses $x = 4$, so $f$ is undefined there: $2(4) + c = 0$, which gives $c = -8$.

The zeros 5 and 6 come from the numerator: $x^2 + ax + b = (x - 5)(x - 6) = x^2 - 11x + 30$. So $a = -11$, $b = 30$.

$a + b + c = -11 + 30 - 8 = 11$.`,
  },
  {
    n: 29,
    skill: NF,
    page: 23,
    stem: r`The function $h$ is defined by

$$h(x) = -\sqrt{x^2 + bx + c}$$

The graph of $y = h(x)$ passes through $(2, 0)$ and $\left(0, -\sqrt{358}\right)$. If $h(m) = 0$, what is the greatest possible value of $m$?`,
    grid: ["179"],
    explanation: r`From $(0, -\sqrt{358})$: $c = 358$. From $(2, 0)$: $4 + 2b + 358 = 0$, so $b = -181$.

$h(m) = 0$ means $m^2 - 181m + 358 = 0$. One root is 2, and the roots multiply to 358, so the other is $\tfrac{358}{2} = 179$.

The greatest value is 179.`,
  },
  {
    n: 30,
    skill: EQ,
    page: 23,
    stem: r`$$\sqrt[7]{p^4} = t^{\frac{5}{7}}$$

In the given equation, $p > 1$ and $t > 1$. If $t = p^{2n - 1}$, where $n$ is a constant, what is the value of $n$?`,
    grid: ["9/10"],
    explanation: r`$p^{\frac{4}{7}} = t^{\frac{5}{7}}$. Raise both sides to the power 7: $p^4 = t^5$, so $t = p^{\frac{4}{5}}$.

$2n - 1 = \tfrac{4}{5}$, so $n = \tfrac{9}{10} = 0.9$.`,
  },
  {
    n: 31,
    skill: NF,
    page: 24,
    stem: r`In the $xy$-plane, a parabola has vertex $(9, -14)$ and intersects the $x$-axis at two points. If the equation of the parabola is written in the form $y = ax^2 + bx + c$ where $a$, $b$, and $c$ are constants, which of the following could be the value of $a + b + c$?`,
    choices: [r`$-23$`, r`$-19$`, r`$-14$`, r`$-12$`],
    answer: "D",
    explanation: r`The vertex is below the $x$-axis and the graph crosses it twice, so the parabola opens upward ($a > 0$). So $y = a(x - 9)^2 - 14$.

$a + b + c$ is the value at $x = 1$: $64a - 14$. Because $a > 0$, this is greater than $-14$.

Only $-12$ works (with $a = \tfrac{1}{32}$).`,
  },
  {
    n: 32,
    skill: NF,
    page: 24,
    stem: r`$$y = ax^2 + bx + c$$

The function $f$ is defined above, where $a$, $b$, and $c$ are constants. The graph of $y = f(x)$ in the $xy$-plane passes through the points $(-16, 0)$ and $(9, 0)$. If $a$ is an integer greater than 3, what is the smallest possible value of $3b - 2a$?`,
    grid: ["76"],
    explanation: r`$f(x) = a(x + 16)(x - 9) = a(x^2 + 7x - 144)$, so $b = 7a$.

$3b - 2a = 21a - 2a = 19a$. The smallest integer $a > 3$ is 4, which gives $19 \cdot 4 = 76$.`,
  },
  {
    n: 33,
    skill: NF,
    page: 24,
    stem: r`$$f(x) = ax^2 + bx + c$$

The function $f$ is defined above, where $a$, $b$, and $c$ are constants and $4 < b < 7$. The graph of $y = f(x)$ is such that $f(1) = f(5)$. If $b$ is an integer, what could be the value of $ab$?`,
    grid: ["-6", "-25/6"],
    explanation: r`$f(1) = f(5)$ puts the axis of symmetry at $x = 3$: $-\dfrac{b}{2a} = 3$, so $a = -\dfrac{b}{6}$.

$ab = -\dfrac{b^2}{6}$. With $b = 5$: $-\tfrac{25}{6}$. With $b = 6$: $-6$. Either answer is correct.`,
  },
  {
    n: 34,
    skill: NF,
    page: 24,
    stem: r`The function $p$ is defined by $p(x) = a\big((x + 6)^2 - b\big)\big((x + 6)^2 - c\big)$, where $a$, $b$, and $c$ are constants. In the $xy$-plane, the graph of $y = p(x)$ passes through the points $(-7, 24)$ and $(0, 899)$. What is the value of $p(-12) + p(-5)$?`,
    grid: ["923"],
    explanation: r`$p$ depends on $x$ only through $(x + 6)^2$.

- $x = -12$ and $x = 0$ both give $(x + 6)^2 = 36$, so $p(-12) = p(0) = 899$.
- $x = -5$ and $x = -7$ both give $(x + 6)^2 = 1$, so $p(-5) = p(-7) = 24$.

Sum: $899 + 24 = 923$.`,
  },
  {
    n: 35,
    skill: NF,
    page: 24,
    stem: r`$$f(x) = \sqrt[3]{x^3 + ax^2 + bx + c}$$

The function $f$ is defined by the given equation, where $a$, $b$, $c$ are integers. The graph of $y = f(x)$ passes through the point $(9, 0)$, and $f(0) = 27$. What is the value of $9a + b$?`,
    grid: ["-2268"],
    explanation: r`$f(0) = \sqrt[3]{c} = 27$, so $c = 27^3 = 19{,}683$.

$f(9) = 0$: $729 + 81a + 9b + 19{,}683 = 0$, so $81a + 9b = -20{,}412$.

Divide by 9: $9a + b = -2{,}268$.`,
  },
  {
    n: 36,
    skill: NF,
    page: 24,
    stem: r`$$y = ax^2 + bx + c$$

The equation of a parabola is given, where $a$, $b$, and $c$ are constants. In the $xy$-plane, the parabola has vertex $(3, 11)$ and $c < 0$. Which of the following could be the value of $b$?`,
    choices: [r`$5$`, r`$6$`, r`$7$`, r`$8$`],
    answer: "D",
    explanation: r`$y = a(x - 3)^2 + 11$, so $b = -6a$ and $c = 9a + 11$.

$c < 0$ means $a < -\tfrac{11}{9}$, so $b = -6a > \tfrac{66}{9} \approx 7.33$.

Only 8 works.`,
  },
  {
    n: 37,
    skill: NF,
    page: 24,
    stem: r`A quadratic function models the height, in feet, of an object above the ground in terms of the time, in seconds, after the object was launched. According to the model, the object was launched from a height of 0 feet and reached its maximum height of 1,600 feet 10 seconds after it was launched. Based on the model, what was the height, in feet, of the object 7 seconds after it was launched?`,
    grid: ["1456"],
    explanation: r`Vertex form: $h(t) = a(t - 10)^2 + 1600$. From $h(0) = 0$: $100a = -1600$, so $a = -16$.

$h(7) = -16(9) + 1600 = 1456$.`,
  },
  {
    n: 39,
    skill: NF,
    page: 25,
    stem: r`A chemical reaction in a closed container produces a gas, and the volume $V$ of gas produced over time $t$ (in minutes) can be modeled by a quadratic function. At $t = 5.0$ minutes, the volume of gas produced is 40.0 liters, and at $t = 15.0$ minutes, the volume of gas produced is 160.0 liters. If the reaction starts at $t = 0$ without gas produced, what will be the volume of gas produced at $t = 25.0$ minutes?`,
    choices: [r`375.2 liters`, r`483.6 liters`, r`423.3 liters`, r`333.5 liters`],
    answer: "D",
    explanation: r`$V(0) = 0$, so $V(t) = at^2 + bt$.
$$25a + 5b = 40,\qquad 225a + 15b = 160$$

Triple the first equation ($75a + 15b = 120$) and subtract: $150a = 40$, so $a = \tfrac{4}{15}$ and $b = \tfrac{20}{3}$.

$V(25) = \tfrac{4}{15}(625) + \tfrac{20}{3}(25) = \tfrac{500}{3} + \tfrac{500}{3} \approx 333.3$ liters. The closest choice is D.`,
  },
  {
    n: 40,
    skill: NF,
    page: 25,
    stem: r`If $p(x) = x^2 + kx + 4$ has no real zeros, what is the range of possible values for $k$?`,
    choices: [r`$k < -4$`, r`$-4 < k < 4$`, r`$k > 4$`, r`No range, $k$ can be any real number.`],
    answer: "B",
    explanation: r`No real zeros means a negative discriminant: $k^2 - 16 < 0$, so $-4 < k < 4$.`,
  },
  {
    n: 41,
    skill: NF,
    page: 25,
    stem: r`$$f(x) = -3x^2 + bx + c$$

In the given quadratic function $b$ and $c$ are constants. The graph of $y = f(x)$ in the $xy$-plane is a parabola that has a vertex at the point $(h, k)$, where $h$ and $k$ are constants. If $f(-4) = f(8)$, and the quadratic function has $x$-intercepts at $(r, 0)$ and $(s, 0)$, which of the following must be true?

I. $r + s = 4$
II. $b < 0$
III. $c < k$`,
    choices: [r`I and II only`, r`II and III only`, r`I and III only`, r`I, II, and III`],
    answer: "C",
    explanation: r`$f(-4) = f(8)$ puts the axis at $h = 2$.

I: the $x$-intercepts are symmetric about $x = 2$, so $r + s = 4$. True.

II: $h = \dfrac{b}{6} = 2$, so $b = 12$. False.

III: $k = f(2) = -12 + 24 + c = c + 12$, so $c < k$. True.`,
  },
  {
    n: 42,
    skill: NF,
    page: 25,
    stem: r`The functions $f$ and $g$ are defined by the given equations, where $2 \le x \le 8$. Which of the following equations displays, as a constant or coefficient, the minimum value of the function it defines, where $2 \le x \le 8$?

I. $f(x) = 0.0625(0.5)(2)^{x + 2}$
II. $g(x) = 1500(0.2)^{x - 3}$`,
    choices: [r`I only`, r`II only`, r`I and II`, r`Neither I nor II`],
    answer: "D",
    explanation: r`I: base 2 > 1, so $f$ increases and its minimum is at $x = 2$: $f(2) = 0.0625(0.5)(16) = 0.5$. The 0.5 in the formula is a trap: the coefficient in front of the exponential is $0.0625 \times 0.5 = 0.03125$, which is $f(-2)$, not a value on this interval. The form doesn't display the minimum the way $0.5(2)^{x - 2}$ would.

II: base 0.2 < 1, so $g$ decreases and its minimum is at $x = 8$: $1500(0.2)^5 = 0.48$. Not shown.

Neither.`,
  },
  {
    n: 43,
    skill: EQ,
    page: 26,
    stem: r`The given expression is

$$-16(5x - 3)^2 + 4(5x - 2)^2$$

The given expression can be rewritten as $\dfrac{ax^2}{4} + \dfrac{bx}{4} + \dfrac{c}{4}$, where $a$, $b$, and $c$ are constants. What is the value of $a + b + c$?`,
    grid: ["-112"],
    explanation: r`$-16(25x^2 - 30x + 9) + 4(25x^2 - 20x + 4) = -300x^2 + 400x - 128$.

Multiply by 4 to read off $a$, $b$, $c$: $a = -1200$, $b = 1600$, $c = -512$.

$a + b + c = -112$.`,
  },
  {
    n: 44,
    skill: EQ,
    page: 26,
    stem: r`Given the expression

$$\sqrt[4]{40n} \times \left(\sqrt[5]{40n}\right)^3$$

find the value of $y$ for which the expression is equivalent to $(40n)^{30y}$, where $n > 1$.`,
    choices: [r`$\dfrac{17}{600}$`, r`$\dfrac{10}{600}$`, r`$\dfrac{7}{600}$`, r`$\dfrac{14}{600}$`],
    answer: "A",
    explanation: r`$(40n)^{\frac{1}{4}} \cdot (40n)^{\frac{3}{5}} = (40n)^{\frac{17}{20}}$.

$30y = \tfrac{17}{20}$, so $y = \tfrac{17}{600}$.`,
  },
  {
    n: 45,
    skill: NF,
    page: 26,
    stem: r`$$f(x) = 5(0.92)^{3x}$$

The function $f$ is defined by the given equation. The equation can be rewritten as $f(x) = 5\left(1 - \frac{p}{100}\right)^x$, where $p$ is a constant. Which of the following is closest to the value of $p$?`,
    choices: [r`$8$`, r`$12$`, r`$22$`, r`$24$`],
    answer: "C",
    explanation: r`$(0.92)^{3x} = (0.92^3)^x = (0.7787)^x$.

$1 - \tfrac{p}{100} = 0.7787$, so $p \approx 22.1$.`,
  },
  {
    n: 46,
    skill: EQ,
    page: 26,
    stem: r`Which of the following expressions has $6x - 5b$ as a factor, where $b$ is a positive integer constant?`,
    choices: [r`$24x^2 - 22x - 15b$`, r`$24x^2 + 18x - 15b$`, r`$24x^2 + 36x - 15b$`, r`$24x^2 - 484x - 15b$`],
    answer: "A",
    explanation: r`The other factor must be $(4x + 3)$ to make $24x^2$ and $-15b$:
$$(6x - 5b)(4x + 3) = 24x^2 + (18 - 20b)x - 15b$$

So the $x$-coefficient is $18 - 20b$ for a positive integer $b$: $-2, -22, -42, \dots$

$-22$ (with $b = 2$) is in choice A. 18 would need $b = 0$, and 36 and $-484$ don't give integers.`,
  },
  {
    n: 47,
    skill: NE,
    page: 26,
    stem: r`$$\frac{1}{cx} = \frac{x}{128} + \frac{1}{c}$$

In the given equation, $c$ is a constant. If the equation has exactly one solution, what is the value of $c$?`,
    grid: ["-32"],
    explanation: r`Multiply both sides by $128cx$ (with $x \ne 0$, $c \ne 0$): $128 = cx^2 + 128x$, or $cx^2 + 128x - 128 = 0$.

$x = 0$ is never a root, so exactly one solution means a zero discriminant: $128^2 + 4(128)c = 0$, which gives $c = -32$. (Then $x = 2$.)

Note: the book's key lists "C" here, but the question has no answer choices.`,
  },
  {
    n: 48,
    skill: EQ,
    page: 26,
    stem: r`The expression

$$bx^2 - 13x + 22$$

can be rewritten as $(hx - k)(x + j)$ where $b$ is a constant and $h$, $j$, and $k$ are integer constants. Which of the following must be an integer?`,
    choices: [r`$\dfrac{k - 13}{h}$`, r`$\dfrac{13}{b}$`, r`$-\dfrac{j}{22}$`, r`$\dfrac{1}{h}$`],
    answer: "A",
    explanation: r`Expand: $(hx - k)(x + j) = hx^2 + (hj - k)x - jk$.

Matching the $x$-term: $hj - k = -13$, so $k - 13 = hj$.

Then $\dfrac{k - 13}{h} = j$, which is an integer.`,
  },
  {
    n: 49,
    skill: NF,
    page: 27,
    stem: r`$$f(x) = 4^{-(2 + x)}$$

Which of the following equivalent forms of the given function displays the $y$-coordinate of the $y$-intercept of its graph in the $xy$-plane as a constant?`,
    choices: [
      r`$f(x) = \dfrac{1}{16}\left(\dfrac{1}{4}\right)^x$`,
      r`$f(x) = \left(\dfrac{1}{4}\right)^{(2 + x)}$`,
      r`$f(x) = 2^{-2(2 + x)}$`,
      r`$f(x) = 4^{-(2 - x)}$`,
    ],
    answer: "A",
    explanation: r`$f(0) = 4^{-2} = \tfrac{1}{16}$.

$4^{-(2 + x)} = 4^{-2} \cdot 4^{-x} = \tfrac{1}{16}\left(\tfrac{1}{4}\right)^x$, which shows $\tfrac{1}{16}$ as the coefficient. (D isn't even equivalent.)`,
  },
  {
    n: 50,
    skill: NF,
    page: 27,
    stem: r`The equation of a parabola is given, where $a$, $b$, and $c$ are constants. In the $xy$-plane, the parabola has vertex $(5, -9)$ and has zero $x$-intercepts. Which of the following could be the value of $a - b - c$?

$$y = ax^2 + bx + c$$`,
    choices: [r`$-47$`, r`$-5$`, r`$9$`, r`$23$`],
    answer: "D",
    explanation: r`The vertex is below the $x$-axis and the graph never reaches it, so the parabola opens downward: $a < 0$.

$y = a(x - 5)^2 - 9 = ax^2 - 10ax + 25a - 9$, so $b = -10a$ and $c = 25a - 9$.

$a - b - c = a + 10a - 25a + 9 = 9 - 14a$. Since $a < 0$, this is greater than 9. Only 23 works ($a = -1$).

Note: the book's key gives $-47$, which would need $a = 4 > 0$, and then the parabola would cross the $x$-axis.`,
  },
  {
    n: 51,
    skill: NF,
    page: 27,
    stem: r`$$f(x) = (x - a)(x - b)$$

The function $f$ is defined by the given equation, where $a$ and $b$ are integer constants. If $f(32) > 0$, $f(35) < 0$, and $f(38) > 0$, which of the following could be the value of $a + b$?`,
    choices: [r`$35$`, r`$37$`, r`$67$`, r`$69$`],
    answer: "D",
    explanation: r`$f$ is an upward parabola with zeros $a$ and $b$. It is positive at 32, negative at 35 and positive at 38, so one zero is between 32 and 35 and the other is between 35 and 38.

As integers: one zero is 33 or 34, the other is 36 or 37. So $a + b$ is 69, 70 or 71. Only 69 is a choice.

(The book leaves out the equation of $f$. $f(x) = (x - a)(x - b)$ was filled in to match its answer.)`,
  },
  {
    n: 52,
    skill: NF,
    page: 27,
    stem: r`$$f(x) = 3^{-2(x + 1)}$$

Which of the following equivalent forms of the given function $f$ displays, as the base or the coefficient, the $y$-coordinate of the $y$-intercept of the graph of $y = f(x)$ in the $xy$-plane?`,
    choices: [
      r`$f(x) = \left(\dfrac{1}{3}\right)^{(2x + 2)}$`,
      r`$f(x) = \dfrac{1}{9}\left(\dfrac{1}{3}\right)^{2x}$`,
      r`$f(x) = 81^{\left(-\frac{1}{2}x - \frac{1}{2}\right)}$`,
      r`$f(x) = 3^{(-2x - 2)}$`,
    ],
    answer: "B",
    explanation: r`$f(0) = 3^{-2} = \tfrac{1}{9}$.

$3^{-2x - 2} = 3^{-2} \cdot 3^{-2x} = \tfrac{1}{9}\left(\tfrac{1}{3}\right)^{2x}$, which shows $\tfrac{1}{9}$ as the coefficient.`,
  },
  {
    n: 53,
    skill: NE,
    page: 27,
    stem: r`In the given equation, $k$ is a constant. The equation

$$\sqrt{k - x} = 43 - x$$

has exactly one real solution. What is the minimum possible value of $4k$?`,
    grid: ["171"],
    explanation: r`Let $u = 43 - x$, which must be $\ge 0$. Squaring gives $k - x = u^2$, and $x = 43 - u$, so $u^2 - u + (43 - k) = 0$.

Each root $u \ge 0$ gives one solution $x$. The roots add up to 1.
- If $k = 42.75$: double root $u = \tfrac{1}{2}$, so exactly one solution.
- If $42.75 < k \le 43$: two nonnegative roots, so two solutions.
- If $k > 43$: one positive and one negative root, so one solution.
- If $k < 42.75$: no real roots.

The minimum is $k = 42.75$, so $4k = 171$.

Note: the book's key says 173. Check $k = 42.75$: $x = 42.5$ gives $\sqrt{0.25} = 0.5 = 43 - 42.5$ ✓, and it is the only solution.`,
  },
  {
    n: 54,
    skill: NF,
    page: 28,
    stem: r`The function $p$ is defined by

$$p(x) = a\big((x + 5)^2 - b\big)\big((x + 5)^2 - c\big)$$

where $a$, $b$, and $c$ are constants. In the $xy$-plane, the graph of $y = p(x)$ passes through the points $(-4, 34)$ and $(0, 150)$. What is the value of $p(-10) + p(-4)$?`,
    grid: ["184"],
    explanation: r`$p$ depends only on $(x + 5)^2$. $x = -10$ and $x = 0$ both give 25, so $p(-10) = p(0) = 150$.

$p(-10) + p(-4) = 150 + 34 = 184$.`,
  },
  {
    n: 55,
    skill: NF,
    page: 28,
    stem: r`The functions $f$ and $g$ are defined by the given equations, where $2 \le x \le 5$. Which of the following equations displays, as a constant or coefficient, the maximum value of the function it defines, where $2 \le x \le 5$?

I. $f(x) = -(x - 4)^2 + 7$
II. $g(x) = -(x + 4)^2 + 7$`,
    choices: [r`I only`, r`II only`, r`I and II`, r`Neither I nor II`],
    answer: "A",
    explanation: r`I: the vertex $(4, 7)$ is inside $2 \le x \le 5$, so the maximum is 7, which is shown.

II: the vertex is at $x = -4$, outside the interval. On $[2, 5]$, $g$ is decreasing, so its maximum is $g(2) = -29$, which isn't shown.`,
  },
  {
    n: 56,
    skill: EQ,
    page: 28,
    stem: r`In the given equations, $a$ and $b$ are constants, $a > 1$ and $b > 1$. What is the value of $x$?

$$\begin{aligned}\sqrt[7]{a^5} &= \sqrt{b^5}\\ a^{3x - 3} &= b^3\end{aligned}$$`,
    choices: [r`$27/21$`, r`$21/27$`, r`$32/21$`, r`$38/21$`],
    answer: "A",
    explanation: r`$a^{\frac{5}{7}} = b^{\frac{5}{2}}$. Raise both sides to the power $\tfrac{2}{5}$: $b = a^{\frac{2}{7}}$.

$b^3 = a^{\frac{6}{7}}$, so $3x - 3 = \tfrac{6}{7}$, which gives $x = \tfrac{27}{21}$ $\left(= \tfrac{9}{7}\right)$.`,
  },
  {
    n: 57,
    skill: NF,
    page: 28,
    stem: r`$$P(t) = 260(1.03)^{t/8}$$

The function $P$ models the population, in thousands, of a certain city $t$ years after 2009. According to the model, the population is predicted to increase by $n\%$ every 8 years. What is the value of $n$?`,
    choices: [r`$0.22$`, r`$1.03$`, r`$2$`, r`$3$`],
    answer: "D",
    explanation: r`When $t$ increases by 8, the exponent $\tfrac{t}{8}$ increases by 1, so $P$ is multiplied by 1.03: a 3% increase every 8 years.

(The book says "every 8 months", which doesn't match its answer of 3; it's corrected to years here.)`,
  },
  {
    n: 58,
    skill: NF,
    page: 28,
    stem: r`Quadratic function $h$ is defined by

$$h(x) = ax^2 - 2x + c$$

where $a$ and $c$ are constants. The graph of $y = h(x)$ in the $xy$-plane is a parabola that opens downward and has a vertex of $(h, k)$, where $k > 0$. If $h(1) = h(-13)$, which of the following must be true?

I. $-1 < a < 0$
II. $c > 0$`,
    choices: [r`I only`, r`II only`, r`I and II`, r`Neither I nor II`],
    answer: "A",
    explanation: r`$h(1) = h(-13)$ puts the axis at $x = -6$. The vertex is at $x = -\dfrac{-2}{2a} = \dfrac{1}{a}$, so $\tfrac{1}{a} = -6$ and $a = -\tfrac{1}{6}$. I is true.

$k = h(-6) = -\tfrac{1}{6}(36) + 12 + c = c + 6 > 0$, so $c > -6$. For example $c = -1$ works, so II need not be true.

Note: the book's key says B.`,
  },
  {
    n: 59,
    skill: NF,
    page: 29,
    stem: r`$$f(x) = -2x^2 + bx + c$$

In the given quadratic function, $b$ and $c$ are constants. The graph of $y = f(x)$ is a parabola that has a vertex at the point $(h, k)$, where $h$ and $k$ are constants. If $k < 0$ and $f(-5) = f(7)$ which of the following must be true?

I. $c < -1$
II. $b \ge 3$`,
    choices: [r`I only`, r`II only`, r`I and II`, r`Neither I nor II`],
    answer: "C",
    explanation: r`$f(-5) = f(7)$ puts the axis at $h = 1$. The vertex is at $x = \dfrac{b}{4}$, so $b = 4$, and II ($b \ge 3$) is true.

$k = f(1) = -2 + 4 + c = c + 2 < 0$, so $c < -2$, and I ($c < -1$) is true.

Note: the book's key says A, but $b = 4$ makes II true as well.`,
  },
  {
    n: 60,
    skill: NE,
    page: 29,
    stem: r`The function $f$ is defined by

$$f(x) = 9x^2 + kx - 21$$

where $k$ is a constant. In the $xy$-plane, the graph of $y = f(x)$ passes through the points $(r, 23)$ and $(2r, 139)$, where $r$ is a constant. Which of the following could be the value of $k$?`,
    choices: [r`$4$`, r`$12$`, r`$116$`, r`$162$`],
    answer: "A",
    explanation: r`$9r^2 + kr = 44$ and $36r^2 + 2kr = 160$.

Double the first equation ($18r^2 + 2kr = 88$) and subtract it from the second: $18r^2 = 72$, so $r = \pm 2$.

$r = 2$: $36 + 2k = 44$, so $k = 4$. ($r = -2$ gives $k = -4$.)

Note: the book's key says 162, which doesn't satisfy the equations.`,
  },
  {
    n: 61,
    skill: NF,
    page: 29,
    stem: r`The function $f$ is defined by

$$f(x) = a\sqrt{-x + b}$$

where $a$ and $b$ are constants. In the $xy$-plane, the graph of $y = f(x)$ passes through the point $(5, 0)$, and $f(-12) > f(-7)$. Which of the following must be true?`,
    choices: [r`$a < f(b)$`, r`$a > b$`, r`$f(3) < f(-2b)$`, r`$a < b$`],
    answer: "C",
    explanation: r`$(5, 0)$ gives $\sqrt{-5 + b} = 0$, so $b = 5$.

$f(-12) = a\sqrt{17}$ and $f(-7) = a\sqrt{12}$. The first is larger, so $a > 0$.

C: $f(3) = a\sqrt{2}$ and $f(-2b) = f(-10) = a\sqrt{15}$. With $a > 0$, $f(3) < f(-10)$. Always true.

A is false ($f(5) = 0 < a$). B and D depend on $a$, which can be any positive number.

Note: the book's key says D.`,
  },
  {
    n: 62,
    skill: NF,
    page: 29,
    stem: r`The function $q$ is defined by

$$q(x) = a\lvert x - 9 \rvert^2 - 87\lvert x - 9 \rvert + b$$

where $a$ and $b$ are constants and $a > b > 87$. If $q(639) = h$ and $q(-621) = k$, where $h$ and $k$ are constants, what is the value of $9(-639)^{h - k} + 621(9)^{k - h}$?`,
    grid: ["630"],
    explanation: r`$\lvert 639 - 9 \rvert = 630$ and $\lvert -621 - 9 \rvert = 630$, so $q(639) = q(-621)$, which means $h = k$.

Both exponents are 0: $9(1) + 621(1) = 630$.`,
  },
  {
    n: 63,
    skill: EQ,
    page: 29,
    stem: r`$$34z^{18} + bz^9 + 30$$

In the given expression, $b$ is a positive integer. If $qz^9 + r$ is a factor of the expression, where $q$ and $r$ are positive integers, what is the greatest possible value of $b$?`,
    grid: ["1021"],
    explanation: r`With $u = z^9$: $34u^2 + bu + 30 = (qu + r)(su + t)$, where $qs = 34$, $rt = 30$ and $b = qt + rs$.

To maximize $b$, take $q = 34$, $t = 30$, $r = s = 1$: $b = 34 \cdot 30 + 1 = 1021$, from $(34z^9 + 1)(z^9 + 30)$.`,
  },
  {
    n: 64,
    skill: NF,
    page: 30,
    stem: r`The function

$$v(x) = \frac{x^2 + bx + c}{(x - 7)(x - 17)}$$

where $b$, $c$ are constants goes through the points $\left(0, \frac{99}{119}\right)$ and $(11, 0)$. There is another point where $v(q) = 0$. What is the value of $q$?`,
    grid: ["9"],
    explanation: r`$v(0) = \dfrac{c}{(-7)(-17)} = \dfrac{c}{119} = \dfrac{99}{119}$, so $c = 99$.

$v(11) = 0$: $121 + 11b + 99 = 0$, so $b = -20$.

$x^2 - 20x + 99 = (x - 9)(x - 11)$, so the other zero is $q = 9$.`,
  },
  {
    n: 65,
    skill: NF,
    page: 30,
    stem: r`The function

$$f(x) = 6(x - a)(x - b)(x - c)$$

is defined by the given equation, where $a$, $b$, and $c$ are distinct constants. When $a < x < b$, the value of $f(x)$ is positive. The graph of $y = f(x)$ in the $xy$-plane contains the point $(r, s)$, where $r$ and $s$ are constants. If $s = 9$, which of the following could be true?

I. $r < a$
II. $b < r < c$
III. $r > c$`,
    choices: [r`I only`, r`III only`, r`I and III only`, r`II and III only`],
    answer: "B",
    explanation: r`A cubic with a positive leading coefficient is negative before its first zero, positive between the first and second, negative between the second and third, and positive after the third.

$f > 0$ on $(a, b)$, so $a$ and $b$ are the first two zeros and $c$ is the largest: $a < b < c$.

$f(r) = 9 > 0$, so $r$ is between $a$ and $b$ or greater than $c$.
- I: $r < a$ gives $f < 0$. Impossible.
- II: $b < r < c$ gives $f < 0$. Impossible.
- III: $r > c$ gives $f > 0$. Possible.

Note: the book's key says C, but $x < a$ makes all three factors negative, so $f(x) < 0$ there. (Question 67 has the same setup, and the book's key for it is B.)`,
  },
  {
    n: 66,
    skill: NF,
    page: 30,
    stem: r`$$f(x) = 15(b)^x$$

In the given function, $b$ is a positive constant. For every increase in the value of $x$ by 1, the value of $f(x)$ increases by $c\%$, where $0 < c < 100$. Which expression gives the value of $c$ in terms of $b$?`,
    choices: [r`$1 + \dfrac{b}{100}$`, r`$b + 100$`, r`$100(b + 1)$`, r`$100(b - 1)$`],
    answer: "D",
    explanation: r`An increase of $c\%$ per step means the base is $1 + \tfrac{c}{100}$. So $b = 1 + \tfrac{c}{100}$, which gives $c = 100(b - 1)$.`,
  },
  {
    n: 67,
    skill: NF,
    page: 30,
    stem: r`$$g(x) = 12(x - a)(x - b)(x - c)$$

where $a$, $b$, and $c$ are distinct constants. When $a < x < b$, $g(x)$ will be positive. If $(p, q)$ is on the graph of $g(x)$, where $p$ and $q$ are constants, and $q = 45$, which of the following could be true?

I. $p < a$
II. $b < p < c$
III. $p > c$`,
    choices: [r`Only I`, r`Only III`, r`I and III only`, r`II and III only`],
    answer: "B",
    explanation: r`The leading coefficient is positive and $g > 0$ on $(a, b)$, so $a < b < c$, and $g$ is positive only on $(a, b)$ and $(c, \infty)$.

$g(p) = 45 > 0$, so $p$ can't be less than $a$ or between $b$ and $c$. Only III is possible.`,
  },
  {
    n: 68,
    skill: NF,
    page: 31,
    stem: r`The function $f$ is defined by

$$f(x) = ab^x$$

where $a$, $b$, and $n$ are constants, and $b$ and $n$ are integers. If $f(4) = 5$ and $f(7) = 135$, what is the value of $f(9)$?`,
    grid: ["1215"],
    explanation: r`$\dfrac{f(7)}{f(4)} = b^3 = 27$, so $b = 3$.

$f(9) = f(7) \cdot b^2 = 135 \cdot 9 = 1215$.`,
  },
  {
    n: 69,
    skill: NF,
    page: 31,
    stem: r`$$r(t) = 55t - 2t^2$$

The function $r$ is defined by the given equation. The function $s$ is defined by $s(t) = r(t) + 1$. Which expression represents the maximum value of $s(t)$?`,
    choices: [
      r`$1 + \left(\dfrac{55}{2}\right)^2$`,
      r`$1 + 2\left(\dfrac{55}{4}\right)^2$`,
      r`$1 - 2\left(\dfrac{55}{4}\right)^2$`,
      r`$1 - \left(\dfrac{55}{2}\right)^2$`,
    ],
    answer: "B",
    explanation: r`Complete the square: $r(t) = -2\left(t^2 - \tfrac{55}{2}t\right) = -2\left(t - \tfrac{55}{4}\right)^2 + 2\left(\tfrac{55}{4}\right)^2$.

So the maximum of $r$ is $2\left(\tfrac{55}{4}\right)^2$, and the maximum of $s$ is $1 + 2\left(\tfrac{55}{4}\right)^2$.`,
  },
  {
    n: 70,
    skill: EQ,
    page: 31,
    stem: r`The polynomial

$$8x^4 + 50x^2 + 63$$

can be factored, and one of the factors is of the form $(ax^2 + b)$. What is one possible value of the product $a \cdot b$?`,
    grid: ["18", "28"],
    explanation: r`Look for $(ax^2 + b)(cx^2 + d)$ with $ac = 8$, $bd = 63$ and $ad + bc = 50$.

$(4x^2 + 7)(2x^2 + 9)$ works: $4 \cdot 9 + 7 \cdot 2 = 50$ ✓.

So $ab$ is $4 \cdot 7 = 28$ or $2 \cdot 9 = 18$. Either answer is correct.`,
  },
  {
    n: 71,
    skill: EQ,
    page: 31,
    stem: r`$$-16(5x - 3)^2 + 4(5x - 2)^2$$

The given expression can be rewritten as $ax^2 + bx + c$, where $a$, $b$, $c$ are constants. What is the value of $\dfrac{(a + b + c)(a - b + c)}{100}$?`,
    grid: ["5796/25"],
    explanation: r`Expanding (as in question 43): $-300x^2 + 400x - 128$.

$a + b + c = -28$ and $a - b + c = -828$.

$\dfrac{(-28)(-828)}{100} = 231.84$. That's 6 characters, so enter $231.8$.

(The book's version of this question is garbled and even includes a transcription note. It's restated here to match the book's answer, 231.84.)`,
  },
  {
    n: 72,
    skill: NF,
    page: 31,
    stem: r`The function $f$ is defined by $f(x) = a^x - b$ where $a$ and $b$ are constants. In the $xy$-plane, the graph of $y = f(x)$ passes through the points $(c, 7)$ and $(2c, 117)$, where $c$ is a constant. Which of the following could be the value of $b$?`,
    choices: [r`$4$`, r`$17$`, r`$110$`, r`$124$`],
    answer: "A",
    explanation: r`Let $u = a^c$. Then $u - b = 7$ and $u^2 - b = 117$.

Subtract: $u^2 - u = 110$, so $(u - 11)(u + 10) = 0$. A power of $a$ is positive, so $u = 11$.

$b = 11 - 7 = 4$.`,
  },
  {
    n: 73,
    skill: NF,
    page: 31,
    stem: r`The graph of functions $f$ and $g$ are parabolas, such that $g(x) = 6f(x)$. The vertex of $f(x)$ is at $(2, 10)$. The $y$-intercept of $f(x)$ and $g(x)$ is at $(0, b)$ and $(0, c)$, respectively. If the point $(3, 78)$ is on the graph of $g(x)$, what is the value of $b - c$?`,
    choices: [r`$-60$`, r`$-110$`, r`$-130$`, r`$-200$`],
    answer: "B",
    explanation: r`$f(x) = k(x - 2)^2 + 10$. From $g(3) = 78$: $f(3) = 13$, so $k = 3$.

$b = f(0) = 12 + 10 = 22$ and $c = 6b = 132$.

$b - c = -110$.`,
  },
  {
    n: 74,
    skill: NF,
    page: 32,
    stem: r`The functions $f$ and $g$ are defined by the given equations, where $x \le 0$. Which of the following equations displays, as a constant or coefficient, the maximum value of the function it defines, where $x \le 0$?

I. $f(x) = -(x + 4)^2 + 7$
II. $g(x) = -(x - 4)^2 + 7$`,
    choices: [r`I only`, r`II only`, r`I and II`, r`Neither I nor II`],
    answer: "A",
    explanation: r`I: the vertex $(-4, 7)$ satisfies $x \le 0$, so the maximum is 7, which is shown.

II: the vertex is at $x = 4$, outside the domain. For $x \le 0$, $g$ is increasing, so its maximum is $g(0) = -9$, which isn't shown.`,
  },
  {
    n: 75,
    skill: NF,
    page: 32,
    stem: r`The function $f$ is defined by

$$f(x) = ax^2 + bx + c$$

where $a$, $b$ and $c$ are constants. The graph of $y = f(x)$ in the $xy$-plane passes through the points $(13, 0)$ and $(-6, 0)$. Which of the following is the value of $a + b$ in terms of $a$?`,
    choices: [r`$7a$`, r`$6a$`, r`$-6a$`, r`$-7a$`],
    answer: "C",
    explanation: r`$f(x) = a(x - 13)(x + 6) = a(x^2 - 7x - 78)$, so $b = -7a$.

$a + b = -6a$.`,
  },
  {
    n: 76,
    skill: NF,
    page: 32,
    stem: r`$$f(x) = \frac{3}{8}(x - 3)^3 + \frac{ax^2}{4} + \frac{bx}{4} + \frac{c}{4} + \frac{99}{2}$$

If the $x$-coordinates of the $x$-intercepts of the given function, $f$, are at $x = 4$, $x = 12$ and $x = -2$, what is the value of $16(a + b + c)$?`,
    choices: [r`$-322$`, r`$-457$`, r`$-603$`, r`$-789$`],
    answer: "C",
    flag: r`As printed, $16(a + b + c) = -600$, which isn't a choice. The book's key is C ($-603$), the closest.`,
    explanation: r`$f$ is a cubic with leading coefficient $\tfrac{3}{8}$ and zeros 4, 12, $-2$, so $f(x) = \tfrac{3}{8}(x - 4)(x - 12)(x + 2)$.

$a + b + c$ appears when $x = 1$:
$$f(1) = \tfrac{3}{8}(-8) + \tfrac{a + b + c}{4} + \tfrac{99}{2} \qquad\text{and}\qquad f(1) = \tfrac{3}{8}(-3)(-11)(3) = \tfrac{297}{8}$$

So $\tfrac{a + b + c}{4} = \tfrac{297}{8} + 3 - \tfrac{99}{2} = -\tfrac{75}{8}$, which gives $16(a + b + c) = -600$.

As printed that isn't a choice. C ($-603$) is the book's answer and the closest choice.`,
  },
  {
    n: 77,
    skill: NF,
    page: 32,
    stem: r`The function $f$ is defined by

$$f(x) = 3x^2 - 5x + 10$$

If the function $f(x - 2)$ is written in the form $ax^2 + bx + c$, what is the value of $a + b + c$?`,
    grid: ["18"],
    explanation: r`$a + b + c$ is the value of $f(x - 2)$ at $x = 1$, which is $f(-1) = 3 + 5 + 10 = 18$.`,
  },
  {
    n: 78,
    skill: NE,
    page: 32,
    stem: r`In the given equation, $p$ is a positive constant. The product of the solutions to the equation

$$(3x - 7p)(5x^2 + 8x - 4p)(x^3 + 3x^2 - 16x - 48) = 0$$

is $-\frac{560}{9}$. What is the value of $p$?`,
    grid: ["5/6"],
    explanation: r`Solutions from each factor:
- $x = \tfrac{7p}{3}$
- $5x^2 + 8x - 4p = 0$: product of the roots $-\tfrac{4p}{5}$
- $x^3 + 3x^2 - 16x - 48 = (x + 3)(x - 4)(x + 4)$: roots $-3$, $4$, $-4$, product 48

Total: $\tfrac{7p}{3} \cdot \left(-\tfrac{4p}{5}\right) \cdot 48 = -\tfrac{448p^2}{5} = -\tfrac{560}{9}$, so $p^2 = \tfrac{25}{36}$ and $p = \tfrac{5}{6}$.`,
  },
  {
    n: 79,
    skill: NE,
    page: 32,
    stem: r`$$14x^2 + (21a - 35b)x - ab = 0$$

The equation above has two real solutions, where $a$ and $b$ are positive constants. The sum of the solutions to the given equation is $k(21a - 35b)$, where $k$ is a constant. What is the value of $k$?`,
    grid: ["-1/14"],
    explanation: r`For $Ax^2 + Bx + C = 0$, the solutions add up to $-\tfrac{B}{A}$:
$$-\frac{21a - 35b}{14} = -\frac{1}{14}(21a - 35b)$$
So $k = -\tfrac{1}{14}$.

(The book leaves out the equation. This one was filled in to match the book's answer, $-\tfrac{1}{14}$.)`,
  },
  {
    n: 80,
    skill: NF,
    page: 33,
    stem: r`An acceptable noise criterion rating for the background noise in a school classroom is 30. For a noise criterion rating of 30, the equation

$$y = 19(0.978)^{x - 50} + 37$$

gives the estimated sound pressure level, $y$ in decibels, as a function of the octave band center frequency, $x$, in hertz, where $x \ge 50$. Which of the following is the best interpretation of 37 in this context?`,
    choices: [
      r`37 is 19 less than the estimated sound pressure level, in decibels, at an octave band frequency of 50`,
      r`37 is 19 less than the estimated sound pressure level, in decibels, at an octave band frequency of 0`,
      r`37 is the estimated sound pressure level, in decibels, at an octave band frequency of 50`,
      r`37 is the estimated sound pressure level, in decibels, at an octave band frequency of 0`,
    ],
    answer: "A",
    explanation: r`At $x = 50$: $y = 19(1) + 37 = 56$. So 37 is 19 less than the level at 50 hertz.

(The domain starts at $x = 50$, so a frequency of 0 isn't in the model.)`,
  },
  {
    n: 81,
    skill: NF,
    page: 33,
    stem: r`The functions $f$, $g$ and $h$ are defined by the given equations, where $x \ge 0$. Which of the following equations displays, as a constant or coefficient, the maximum or minimum value of the function it defines, where $x \ge 0$?

I. $f(x) = (x - 3)^2 + 6$
II. $g(x) = (x + 3)^2 + 6$
III. $h(x) = (x - 5)^2 + 8$`,
    choices: [r`I only`, r`I and III only`, r`Both I and II`, r`None of these`],
    answer: "B",
    explanation: r`I: vertex at $x = 3 \ge 0$, minimum 6, shown.

II: vertex at $x = -3$, outside the domain. The minimum for $x \ge 0$ is $g(0) = 15$, not shown, and there is no maximum.

III: vertex at $x = 5$, minimum 8, shown.`,
  },
  {
    n: 82,
    skill: NF,
    page: 33,
    stem: r`$$f(x) = -2(x - a)(x - b)(x - c)$$

The function $f$ is defined by the given equation, where $a$, $b$ and $c$ are distinct constants. When $b < x < c$, the value of $f(x)$ is positive. The graph of $y = f(x)$ in the $xy$-plane contains the point $(m, n)$, where $m$ and $n$ are constants. If $n$ is equal to $-5$, which of the following could be true?

I. $m < a$
II. $a < m < b$
III. $m > c$`,
    choices: [r`I only`, r`II only`, r`II and III`, r`I and III`],
    answer: "C",
    explanation: r`With a negative leading coefficient, the sign pattern across the zeros is $+, -, +, -$.

$f > 0$ on $(b, c)$, so $b$ and $c$ are the second and third zeros and $a$ is the smallest: $a < b < c$.

$f(m) = -5 < 0$ happens on $(a, b)$ and on $(c, \infty)$. II and III are possible. For $m < a$, $f$ is positive, so I is impossible.

Note: the book's key says D.`,
  },
  {
    n: 83,
    skill: EQ,
    page: 34,
    stem: r`Which of the following below has a factor of $4x + 7b$, where $b$ is a non-positive integer?

I. $16x^2 - 49$
II. $16x^2 + 56x + 49$
III. $64x^3 + 343$`,
    choices: [r`I only`, r`II and III only`, r`I and III only`, r`All of them`],
    answer: "A",
    explanation: r`$b \le 0$ means the factor is $4x$, $4x - 7$, $4x - 14$, and so on.

I: $16x^2 - 49 = (4x - 7)(4x + 7)$ has the factor $4x - 7$ ($b = -1$). ✓

II: $(4x + 7)^2$ only has $4x + 7$, which needs $b = 1$. ✗

III: $64x^3 + 343 = (4x + 7)(16x^2 - 28x + 49)$, and the quadratic has no real roots. Only $4x + 7$ again. ✗

Note: the book's key says C, which doesn't fit any reading of $b$. If $b$ could be positive, all three would have $4x + 7$ as a factor.`,
  },
  {
    n: 84,
    skill: NE,
    page: 34,
    stem: r`A quadratic function can be used to model the height, in meters, of an object above the ground in terms of time, in seconds, after the object was launched into the air. The object reached a height of 148 meters 2 seconds and a maximum height of 340 meters 10 seconds after it was launched. Based on the model, for how many seconds was the object at a height of at least 97 meters?`,
    grid: ["18"],
    explanation: r`$h(t) = a(t - 10)^2 + 340$. From $h(2) = 148$: $64a = -192$, so $a = -3$.

$-3(t - 10)^2 + 340 = 97$ gives $(t - 10)^2 = 81$, so $t = 1$ or $t = 19$.

The object is at or above 97 m from $t = 1$ to $t = 19$: 18 seconds.

(The book's wording, "the longest time period when the object reached a height of 97 meters", is restated to match its answer, 18.)`,
  },
  {
    n: 85,
    skill: NF,
    page: 34,
    stem: r`The exponential function $f$ is defined by

$$f(x) = ab^x$$

where $a$ and $b$ are positive. If $f(n - 1) = f(n) + \frac{61}{100}f(n - 1)$, where $n$ is a constant, what is the value of $b$?`,
    grid: ["0.39"],
    explanation: r`$f(n) = f(n - 1) - 0.61f(n - 1) = 0.39f(n - 1)$.

Each step multiplies $f$ by $b$, so $b = 0.39$.`,
  },
  {
    n: 86,
    skill: NF,
    page: 34,
    stem: r`The equation $N(m) = 63(Q)^{\frac{m}{6}}$ gives the predicted population $N(m)$, in thousands, of a certain bacteria colony $m$ minutes after the initial measurement, where $Q$ is a constant greater than 1. The predicted population increases by $p\%$ every 180 seconds. What is the value of $p$ in terms of $Q$?`,
    choices: [r`$100(Q^{30} - 1)$`, r`$100\left(Q^{\frac{1}{2}} - 1\right)$`, r`$100(Q^{30} + 1)$`, r`$100\left(Q^{\frac{1}{2}} + 1\right)$`],
    answer: "B",
    explanation: r`180 seconds is 3 minutes. Increasing $m$ by 3 multiplies $N$ by $Q^{\frac{3}{6}} = Q^{\frac{1}{2}}$.

A growth factor of $Q^{\frac{1}{2}}$ is an increase of $100\left(Q^{\frac{1}{2}} - 1\right)$ percent.`,
  },
  {
    n: 87,
    skill: EQ,
    page: 34,
    stem: r`For the polynomial function $v$, $v(2) = 3$ and $v(0) = -13$. The graph of $y = v(x)$ in the $xy$-plane passes through the points $(-2, 7)$ and $(6, 0)$. Which of the following must be true?`,
    choices: [
      r`When $v(x)$ is divided by $(x + 13)$, the remainder is 0.`,
      r`When $v(x)$ is divided by $(x + 7)$, the remainder is $-2$.`,
      r`When $v(x)$ is divided by $(x + 2)$, the remainder is 7.`,
      r`When $v(x)$ is divided by $(x - 6)$, the remainder is $-13$.`,
    ],
    answer: "C",
    explanation: r`Remainder theorem: dividing $v(x)$ by $(x - r)$ leaves remainder $v(r)$.

Dividing by $(x + 2)$ leaves $v(-2) = 7$. ✓

(Dividing by $(x - 6)$ leaves $v(6) = 0$, not $-13$.)`,
  },
  {
    n: 88,
    skill: EQ,
    page: 34,
    stem: r`When the polynomial $P(x) = 2x^3 - 5x^2 + ax + b$ is divided by $x - 2$, the remainder is 10. When $P(x)$ is divided by $x + 1$, the remainder is 1. What is the value of $a + b$?`,
    grid: ["12"],
    explanation: r`$P(2) = 16 - 20 + 2a + b = 10$, so $2a + b = 14$.

$P(-1) = -2 - 5 - a + b = 1$, so $b - a = 8$.

Then $a = 2$, $b = 10$ and $a + b = 12$.

Note: the book's key says 10, which is $b$ alone.`,
  },
  {
    n: 89,
    skill: NE,
    page: 35,
    stem: r`$$\frac{x^2}{\sqrt{x^2 - c^2}} = \frac{c^2}{\sqrt{x^2 - c^2}} + 39$$

In the given equation, $c$ is a positive constant. Which of the following is one of the solutions to the given equation?`,
    choices: [r`$-c$`, r`$-c^2 - 39^2$`, r`$-\sqrt{39^2 - c^2}$`, r`$-\sqrt{c^2 + 39^2}$`],
    answer: "D",
    explanation: r`Subtract: $\dfrac{x^2 - c^2}{\sqrt{x^2 - c^2}} = 39$, which simplifies to $\sqrt{x^2 - c^2} = 39$.

So $x^2 = c^2 + 39^2$ and $x = \pm\sqrt{c^2 + 39^2}$.

(The book prints the 39 inside the radical, which looks like a typesetting slip. Its answer, D, matches this version.)`,
  },
  {
    n: 90,
    skill: EQ,
    page: 35,
    stem: r`The expression

$$12x^2 + 41x + 35$$

can be rewritten as $(4x + r)(3x + s)$, where $r$ and $s$ are integers, or as $(4x + t)(3x + v)$, where $t$ and $v$ are not integers. What is the value of $s + v$?`,
    choices: [r`$\dfrac{41}{3}$`, r`$\dfrac{41}{4}$`, r`$12$`, r`$35$`],
    answer: "B",
    explanation: r`Expanding gives $4s + 3r = 41$ and $rs = 35$.

Integers: $r = 7$, $s = 5$.

Nonintegers: $4v + 3t = 41$ and $tv = 35$. Substituting $t = \tfrac{41 - 4v}{3}$ gives $4v^2 - 41v + 105 = 0$, so $v = 5$ or $v = \tfrac{21}{4}$. The noninteger one is $v = \tfrac{21}{4}$ (with $t = \tfrac{20}{3}$).

$s + v = 5 + \tfrac{21}{4} = \tfrac{41}{4}$.`,
  },
  {
    n: 91,
    skill: NF,
    page: 35,
    stem: r`For the function $f$, for each increase in the value of $x$ by 4, the value of $f(x)$ increases by a factor of $m$. Which of the following equivalent forms displays $m$ as a constant or coefficient?`,
    choices: [
      r`$f(x) = 13(100)^{2x}$`,
      r`$f(x) = 13(1000)^{\frac{x}{3}}$`,
      r`$f(x) = 13\left(10^{\frac{6}{5}}\right)^{6x}$`,
      r`$f(x) = 13\left(100000^{\frac{6}{5}}\right)^{\frac{1}{4}x}$`,
    ],
    answer: "D",
    explanation: r`A factor of $m$ every 4 units means $f(x) = A \cdot m^{\frac{x}{4}}$. The base is $m$ exactly when the exponent is $\tfrac{1}{4}x$.

Only D has that exponent. Its base, $100000^{\frac{6}{5}} = 10^6$, is $m$.`,
  },
  {
    n: 92,
    skill: NF,
    page: 35,
    stem: r`The function $f$ is defined by

$$f(x) = ab^x$$

where $a$, $b$, and $x$ are constants, and $a$, $b$, and $x$ are integers. If $f(2) = 6$ and $f(5) = 162$, what is the value of $f(7)$?`,
    grid: ["1458"],
    explanation: r`$b^3 = \tfrac{162}{6} = 27$, so $b = 3$.

$f(7) = f(5) \cdot 3^2 = 162 \cdot 9 = 1458$.`,
  },
  {
    n: 93,
    skill: NE,
    page: 35,
    stem: r`$$x(9x - 2a) + b(9x - 2a) - (x + b) = 0$$

In the given equation, $a$ and $b$ are positive constants. A solution to the equation is $x = 42$. What is the value of $a$?`,
    grid: ["377/2"],
    explanation: r`Factor: $(x + b)(9x - 2a) - (x + b) = (x + b)(9x - 2a - 1) = 0$.

The solutions are $x = -b$ (negative) and $x = \tfrac{2a + 1}{9}$.

$\tfrac{2a + 1}{9} = 42$, so $2a + 1 = 378$ and $a = 188.5$.`,
  },
  {
    n: 94,
    skill: EQ,
    page: 36,
    stem: r`For a polynomial function $f$, the graph of $y = f(x)$ in the $xy$-plane contains the points $(-6, 0)$, $(7, 0)$, $(0, 0)$, and $(4, 0)$. Which of the following must be a factor of $f(x)$?`,
    choices: [r`$x^2 - 2x - 24$`, r`$x^2 - x + 42$`, r`$x^2 - 11x - 28$`, r`$x^2 - 7x$`],
    answer: "D",
    explanation: r`The zeros $-6$, 7, 0 and 4 mean $(x + 6)$, $(x - 7)$, $x$ and $(x - 4)$ are factors.

$x^2 - 7x = x(x - 7)$ is a product of two of them. A is $(x - 6)(x + 4)$ and C has the wrong sign on 28. B doesn't factor over the integers.`,
  },
  {
    n: 97,
    skill: NF,
    page: 36,
    stem: r`${fig("adv-97", 260)}

In the $xy$-plane above, the function $f$ is defined by $f(x) = 2x^3 + 3x^2 + ax + b$, where $a$ and $b$ are constants. If the graph of $f$ intersects the $x$-axis at three points, what is the value of $a$?`,
    grid: ["-11"],
    explanation: r`The graph crosses the $y$-axis at $-6$, so $b = -6$. It crosses the $x$-axis at $-3$ and 2, plus a third point $r$:
$$f(x) = 2(x + 3)(x - 2)(x - r)$$

Constant term: $2(3)(-2)(-r) = 12r = -6$, so $r = -\tfrac{1}{2}$.

$f(x) = 2(x^2 + x - 6)\left(x + \tfrac{1}{2}\right) = 2x^3 + 3x^2 - 11x - 6$, so $a = -11$.

(The book's key lists "D" here, but the question has no answer choices.)`,
  },
  {
    n: 98,
    skill: NF,
    page: 36,
    stem: r`${fig("adv-98", 260)}

The graph of $y = a(x + 1)(x - 5)$ is shown in the $xy$-plane above, where $a$ is a constant. If the graph with vertex $(h, k)$ intersects the $y$-axis at point $(0, 5)$, which of the following is equal to $k$?`,
    choices: [r`$7$`, r`$8$`, r`$9$`, r`$10$`],
    answer: "C",
    explanation: r`$y(0) = a(1)(-5) = 5$, so $a = -1$.

The vertex is halfway between the zeros, at $h = 2$: $k = -(3)(-3) = 9$.`,
  },
  {
    n: 99,
    skill: NF,
    page: 37,
    stem: r`${fig("adv-99", 260)}

In the $xy$-plane above, the graph of a quadratic function $y = f(x)$ intersects the $x$-axis at points $O$ and $Q$, and has a vertex at point $P$. If line $\ell$ passes through points $P$ and $Q$, what is the $y$-intercept of line $\ell$?`,
    grid: ["10"],
    explanation: r`$P = (3, 5)$ and $Q = (6, 0)$. Slope: $\tfrac{0 - 5}{6 - 3} = -\tfrac{5}{3}$.

Going from $P$ back 3 units to $x = 0$ adds $3 \cdot \tfrac{5}{3} = 5$, so the $y$-intercept is $5 + 5 = 10$.

(The book's key lists "B" here, but the question has no answer choices.)`,
  },
  {
    n: 100,
    skill: NF,
    page: 37,
    stem: r`${fig("adv-100", 280)}

The function $f$ is defined by $f(x) = x^3$. The function $g$ is defined by $g(x) = a \cdot f(x + b) + c$, where $a$, $b$, and $c$ are constants. The graph of $y = g(x)$ is shown in the $xy$-plane. Find the value of $ab$.`,
    grid: ["-72"],
    explanation: r`The flat center of the cubic moved from $(0, 0)$ to $(4, 6)$, so $b = -4$ and $c = 6$.

$g(5) = a(1)^3 + 6 = 24$, so $a = 18$.

$ab = 18(-4) = -72$.`,
  },
  {
    n: 101,
    skill: NE,
    page: 37,
    stem: r`The graphs of $y = x^2$ and $y = mx - 1$ are shown in the $xy$-plane below, where $m$ is the slope of the line. If the graph of $y = mx - 1$ is tangent to the graph of $y = x^2$, what is the value of $m$?

${fig("adv-101", 280)}`,
    grid: ["2"],
    explanation: r`Tangent means exactly one intersection: $x^2 - mx + 1 = 0$ has a zero discriminant.

$m^2 - 4 = 0$, so $m = \pm 2$. The line in the graph has positive slope, so $m = 2$ (tangent at $(1, 1)$).`,
  },
  {
    n: 102,
    skill: NF,
    page: 37,
    stem: r`A certain investment account offers a special interest rate for the first 4 months the account is open followed by a lower interest rate for the remainder of the time the account is open. Akeyla opened one of these accounts with an original account balance of \$700.00 and did not make any other deposits or withdrawals. 4 months after Akeyla opened the account, the balance had increased by 0.6% of the original balance. 6 months after Akeyla opened the account, the balance had increased by an additional 0.1% of the balance at the end of the first 4 months. Every 2 months after the first 6 months, the balance had increased by an additional 0.1% of the balance 2 months before. Which of the following equations could represent the account balance $B(x)$ in dollars, $x$ months after the account was opened, where $x \ge 4$?`,
    choices: [
      r`$B(x) = 704.20(1.001)^{\frac{x - 4}{2}}$`,
      r`$B(x) = 700.00(1.001)^{\frac{x - 4}{2}}$`,
      r`$B(x) = 704.20(1.001)^{2(x - 4)}$`,
      r`$B(x) = 700.00(1.001)^{2(x - 4)}$`,
    ],
    answer: "A",
    explanation: r`After 4 months: $700(1.006) = 704.20$.

After that the balance is multiplied by 1.001 every 2 months, so the number of growth periods is $\tfrac{x - 4}{2}$:
$$B(x) = 704.20(1.001)^{\frac{x - 4}{2}}$$`,
  },
  {
    n: 103,
    skill: NF,
    page: 38,
    stem: r`${fig("adv-103", 280)}

Which of the following could be the equation of the graph shown in the $xy$-plane?`,
    choices: [
      r`$y = -\dfrac{1}{15}(x - 6)(x - 4)^2(x + 1)$`,
      r`$y = -\dfrac{1}{15}(x - 6)^2(x - 4)(x + 1)^2$`,
      r`$y = -\dfrac{1}{15}(x + 6)(x + 4)^2(x + 1)$`,
      r`$y = -\dfrac{1}{15}(x + 6)^2(x + 4)(x - 1)^2$`,
    ],
    answer: "A",
    explanation: r`The graph crosses the $x$-axis at $-1$ and 6 (single factors) and touches it at 4 (squared factor): $(x + 1)(x - 4)^2(x - 6)$.

Check: at $x = 0$, A gives $-\tfrac{1}{15}(-6)(16)(1) = 6.4$, which matches the graph.`,
  },
  {
    n: 104,
    skill: EQ,
    page: 38,
    stem: r`For a certain circuit, its power $P$, in watts; current $C$, in amperes; voltage $V$, in volts; and resistance $R$, in ohms, are related as

$$\frac{CV^2}{P} = \sqrt{PR}$$

where $P$, $C$, $V$ and $R$ are positive. When $R = 18$, which equation correctly expresses $P$ in terms of $C$ and $V$?`,
    choices: [
      r`$P = \dfrac{CV^2}{\sqrt{18P}}$`,
      r`$P = \dfrac{CV^2}{\sqrt{18}}$`,
      r`$P = \sqrt[3]{\dfrac{C^2V^4}{18}}$`,
      r`$P = \sqrt[3]{\dfrac{18}{C^2V^4}}$`,
    ],
    answer: "C",
    explanation: r`Square both sides with $R = 18$: $\dfrac{C^2V^4}{P^2} = 18P$, so $P^3 = \dfrac{C^2V^4}{18}$.

$P = \sqrt[3]{\dfrac{C^2V^4}{18}}$. (A still has $P$ on the right side.)`,
  },
  {
    n: 105,
    skill: NE,
    page: 38,
    stem: r`${fig("adv-105", 300)}

In the $xy$-plane above, the graphs of $y = x^2 - 4$ and $y = mx + k$ intersect at $x = -2$ and $x = 3$. What is the value of $k$?`,
    choices: [r`$1$`, r`$2$`, r`$3$`, r`$4$`],
    answer: "B",
    explanation: r`The intersections solve $x^2 - mx - (4 + k) = 0$, whose roots are $-2$ and 3.

Product of the roots: $-(4 + k) = -6$, so $k = 2$. (Sum: $m = 1$.)`,
  },
  {
    n: 106,
    skill: NF,
    page: 39,
    stem: r`An exponential function $f$ is defined by $f(x) = c^x$, where $c$ is a constant greater than 1. If $f(6) = 25 \cdot f(4)$, what is the value of $c$?`,
    grid: ["5"],
    explanation: r`$c^6 = 25c^4$, so $c^2 = 25$. Since $c > 1$, $c = 5$.`,
  },
  {
    n: 107,
    skill: EQ,
    page: 39,
    stem: r`$$\frac{1}{R} = \frac{1}{p} + \frac{1}{q} + \frac{1}{s} + \frac{1}{13}$$

A parallel electric circuit contains four resistors with resistances of $p$ ohms, $q$ ohms, $s$ ohms, and 13 ohms. The given equation relates the resistance $R$, in ohms, of the circuit, to the resistances of the four individual resistors it contains. Which equation correctly expresses $R$ in terms of $p$, $q$, and $s$?`,
    choices: [
      r`$R = \dfrac{13pqs}{p + q + s + 13}$`,
      r`$R = \dfrac{13pqs}{13qs + 13ps + 13pq + pqs}$`,
      r`$R = \dfrac{13qs + 13ps + 13pq + pqs}{13pqs}$`,
      r`$R = p + q + s + 13$`,
    ],
    answer: "B",
    explanation: r`Common denominator $13pqs$:
$$\frac{1}{R} = \frac{13qs + 13ps + 13pq + pqs}{13pqs}$$

Take reciprocals to get choice B. (C is $\tfrac{1}{R}$, not $R$.)`,
  },
  {
    n: 108,
    skill: EQ,
    page: 39,
    stem: r`In the given equation,

$$\frac{1}{5xy} + xyz = \frac{1}{4yz}$$

Which expression is equivalent to $y$?`,
    choices: [
      r`$\dfrac{5x - 4z}{20xz^2}$`,
      r`$\sqrt{\dfrac{5x - 4z}{20xz^2}}$`,
      r`$\sqrt{\dfrac{1}{4xz^2 - 5xz}}$`,
      r`$\sqrt{\dfrac{1}{4xz^2 - 5xz^2}}$`,
    ],
    answer: "B",
    flag: r`As printed, $y = \sqrt{\tfrac{5x - 4z}{20x^2z^2}}$, which isn't a choice. B is right if the middle term is $yz$ instead of $xyz$.`,
    explanation: r`Multiply every term by $20xyz$:
$$4z + 20x^2y^2z^2 = 5x \quad\Rightarrow\quad y^2 = \frac{5x - 4z}{20x^2z^2}$$

That's choice B with $x^2$ in place of $x$ in the denominator. With the middle term $yz$ (likely the original), the same steps give $y^2 = \tfrac{5x - 4z}{20xz^2}$, which is exactly B, the book's answer.`,
  },
  {
    n: 109,
    skill: EQ,
    page: 39,
    stem: r`Which of the following expressions has $6x - 5b$ as a factor, where $b$ is a positive integer constant?`,
    choices: [r`$24x^2 - 2xb - 15b^2$`, r`$24x^2 + 18xb - 15b^2$`, r`$24x^2 + 36xb - 15b^2$`, r`$24x^2 - 484xb - 15b^2$`],
    answer: "A",
    explanation: r`The other factor must be $4x + 3b$ to make $24x^2$ and $-15b^2$:
$$(6x - 5b)(4x + 3b) = 24x^2 + 18bx - 20bx - 15b^2 = 24x^2 - 2bx - 15b^2$$`,
  },
  {
    n: 110,
    skill: NF,
    page: 39,
    stem: r`The function $v$ is defined by the equation

$$v(x) = \frac{x^2 + bx + c}{(x + 5)(x - 15)}$$

where $b$ and $c$ are constants. In the $xy$-plane, the graph of $y = v(x)$ passes through the points $\left(0, \frac{22}{25}\right)$ and $(11, 0)$. If $v(q) = 0$, which of the following could be the value of $q$?`,
    choices: [r`$-6$`, r`$-5$`, r`$5$`, r`$6$`],
    answer: "A",
    explanation: r`$v(0) = \dfrac{c}{-75} = \dfrac{22}{25}$, so $c = -66$.

$v(11) = 0$: $121 + 11b - 66 = 0$, so $b = -5$.

$x^2 - 5x - 66 = (x - 11)(x + 6)$, so $q = -6$.`,
  },
  {
    n: 111,
    skill: NF,
    page: 40,
    stem: r`$$y = 3\left(\frac{a}{6}\right)^{x + c} - b$$

How many times does the graph of the given equation in the $xy$-plane cross the $x$-axis, where $a$, $b$, and $c$ are positive constants such that $a > 6$ and $b > c$?`,
    choices: [r`Zero`, r`One`, r`Two`, r`Three`],
    answer: "B",
    explanation: r`$a > 6$ makes the base $\tfrac{a}{6} > 1$, so $3\left(\tfrac{a}{6}\right)^{x + c}$ increases from 0 toward infinity.

Subtracting $b > 0$ shifts it down, so the graph goes from just above $-b$ to infinity, always increasing. It crosses the $x$-axis exactly once.`,
  },
  {
    n: 112,
    skill: NE,
    page: 40,
    stem: r`$$2x^2 - 8x - 21 = 0$$

One solution to the given equation can be written as $x = h - \frac{1}{2}\sqrt{k}$, where $h$ and $k$ are integer constants. What is the value of $h + k$?`,
    choices: [r`$-24$`, r`$10$`, r`$29$`, r`$60$`],
    answer: "D",
    explanation: r`Quadratic formula: $x = \dfrac{8 \pm \sqrt{64 + 168}}{4} = 2 \pm \dfrac{\sqrt{232}}{4}$.

$\dfrac{\sqrt{232}}{4} = \dfrac{2\sqrt{58}}{4} = \dfrac{1}{2}\sqrt{58}$, so $h = 2$, $k = 58$ and $h + k = 60$.`,
  },
  {
    n: 113,
    skill: NF,
    page: 40,
    stem: r`At different times on a certain day, a manager at a theme park recorded the number of visitors. An exponential model gives the estimated number of visitors, $V$, at the theme park $t$ hours after the theme park opened, where $t \le 3$. Based on the model, 85 visitors were estimated to be at the theme park when it opened, and every 30 minutes the estimated number of visitors increased by 140% of the estimated number of visitors 30 minutes earlier. Which of the following equations best represents this model?`,
    choices: [r`$V = 85(1.40)^{\frac{t}{2}}$`, r`$V = 85(1.40)^{2t}$`, r`$V = 85(2.40)^{\frac{t}{2}}$`, r`$V = 85(2.40)^{2t}$`],
    answer: "D",
    explanation: r`Increasing by 140% means multiplying by $1 + 1.40 = 2.40$.

There are 2 half-hours in each hour, so the exponent is $2t$: $V = 85(2.40)^{2t}$.`,
  },
  {
    n: 114,
    skill: EQ,
    page: 40,
    stem: r`$$\begin{aligned}r(x) &= 9(x - 3)\\ s(x) &= x^3 + nx^2 + 3nx + 27\end{aligned}$$

For the given functions $r$ and $s$, $n$ is a constant. If $r(x) \cdot s(x) = 9(x^4 - 81)$, what is the value of $n$?`,
    grid: ["3"],
    explanation: r`$9(x^4 - 81) = 9(x - 3)(x + 3)(x^2 + 9)$, so
$$s(x) = (x + 3)(x^2 + 9) = x^3 + 3x^2 + 9x + 27$$

Matching coefficients: $n = 3$ (and $3n = 9$ ✓).`,
  },
  {
    n: 115,
    skill: NF,
    page: 41,
    stem: r`A certain investment account offers a special interest rate for the first 6 months the account is open followed by a lower interest rate for the remainder of the time the account is open. Bennett opened one of these accounts with an original account balance of \$600 and did not make any other deposits or withdrawals. 6 months after Bennett opened the account, the balance had increased by 0.4% of the original balance. 8 months after Bennett opened the account, the balance had increased by an additional 0.3% of the balance at the end of the first 6 months. Every 2 months after the first 8 months, the balance had increased by an additional 0.3% of the balance 2 months before. Which of the following equations could represent the account balance $B(x)$, in dollars, $x$ months after the account was opened, where $x \ge 6$?`,
    choices: [
      r`$B(x) = 602.40(1.003)^{\frac{x}{2} - 6}$`,
      r`$B(x) = 602.40(1.003)^{\frac{x - 6}{2}}$`,
      r`$B(x) = 602.40(1.003)^{2x - 12}$`,
      r`$B(x) = 602.40(1.003)^{2x - 6}$`,
    ],
    answer: "B",
    explanation: r`After 6 months: $600(1.004) = 602.40$. After that the balance grows by a factor of 1.003 every 2 months, which is $\tfrac{x - 6}{2}$ periods.

$B(x) = 602.40(1.003)^{\frac{x - 6}{2}}$.`,
  },
  {
    n: 116,
    skill: NF,
    page: 41,
    stem: r`The function $j$ is defined by $j(x) = \dfrac{10x + 5}{3p}$, and the function $k$ is defined by $k(x) = \dfrac{j(x) \cdot p}{x + 1}$, where $p$ is a positive constant. What is the value of $k(9)$?`,
    choices: [r`$\dfrac{19}{6}$`, r`$\dfrac{10}{3}$`, r`$\dfrac{95}{13}$`, r`$\dfrac{85}{3}$`],
    answer: "A",
    explanation: r`$k(x) = \dfrac{10x + 5}{3p} \cdot \dfrac{p}{x + 1} = \dfrac{10x + 5}{3(x + 1)}$. The $p$ cancels.

$k(9) = \dfrac{95}{30} = \dfrac{19}{6}$.`,
  },
  {
    n: 118,
    skill: NF,
    page: 42,
    stem: r`The function $v$ is defined by the equation $v(x) = \dfrac{x^2 + bx + c}{(x + 5)(x - 19)}$, where $b$ and $c$ are constants. In the $xy$-plane, the graph of $y = v(x)$ passes through the points $\left(0, \frac{66}{95}\right)$ and $(11, 0)$. If $v(q) = 0$, which of the following could be the value of $q$?`,
    choices: [r`$-6$`, r`$-5$`, r`$5$`, r`$6$`],
    answer: "A",
    explanation: r`$v(0) = \dfrac{c}{-95} = \dfrac{66}{95}$, so $c = -66$.

$v(11) = 0$: $121 + 11b - 66 = 0$, so $b = -5$.

$x^2 - 5x - 66 = (x - 11)(x + 6)$, so $q = -6$.`,
  },
];

export const advancedMath = defineChapter({
  source: "Math Hard Book",
  prefix: "mhb-adv",
  domain: "Advanced Math",
  difficulty: "Hard",
  questions,
});
