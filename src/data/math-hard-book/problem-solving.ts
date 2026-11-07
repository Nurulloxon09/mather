import { defineChapter, type Draft } from "../define";

const r = String.raw;
const RAT = "Ratios, rates, proportional relationships, and units";
const PCT = "Percentages";
const ONE = "One-variable data: Distributions and measures of center and spread";
const TWO = "Two-variable data: Models and scatterplots";
const PROB = "Probability and conditional probability";
const INF = "Inference from sample statistics and margin of error";
const OBS = "Evaluating statistical claims: Observational studies and experiments";
const fig = (name: string, w = 300) => `![graph](/figures/mhb/${name}.png){w=${w}}`;
/** A frequency table, laid on its side (a Value row over a Frequency row) so four of them fit as choices. */
const freq = (rows: [number, number][]) =>
  [
    `| Value | ${rows.map(([v]) => v).join(" | ")} |`,
    `|---|${rows.map(() => "---|").join("")}`,
    `| Frequency | ${rows.map(([, f]) => f).join(" | ")} |`,
  ].join("\n");

const questions: Draft[] = [
  {
    n: 1,
    skill: OBS,
    page: 74,
    stem: r`To determine if age and gender are related to pet ownership at his school, Mark selected a random sample of 50 male 14- to 15-year-old students from the school and a random sample of 60 female 17- to 18-year-old students from the school. For each student, he recorded the student's age, gender, and whether the student owned a pet. Which of the following provides the best explanation for why Mark cannot draw a valid conclusion from this study?`,
    choices: [
      r`The sample sizes are too small.`,
      r`The two samples are not of equal size.`,
      r`Mark will be unable to tell whether a difference in pet ownership is related to age because the two age groups are too close in age.`,
      r`Mark will be unable to tell whether a difference in pet ownership is related to gender because of the difference in age. Similarly, he will be unable to tell whether a difference in pet ownership is related to age.`,
    ],
    answer: "D",
    explanation: r`Every male in the study is 14 to 15 and every female is 17 to 18, so age and gender always change together. Any difference in pet ownership between the two samples could come from either one, and the study can't separate them.

Samples of 50 and 60 are large enough, and they don't need to be the same size. Choice D.`,
  },
  {
    n: 2,
    skill: ONE,
    page: 74,
    stem: r`A science class studied the feeding behavior of the birds that visited a bird feeder each school day for a period of time. The table summarizes the number of birds the class observed visiting the bird feeder each school day during this period of time.

| Number of birds | Number of days |
|---|---|
| 14 | 3 |
| 15 | 3 |
| 16 | 4 |
| 17 | 1 |
| 18 | 3 |
| 19 | 9 |

What is the median number of birds the class observed visiting the bird feeder each school day during this period of time?`,
    grid: ["18"],
    explanation: r`There are $3 + 3 + 4 + 1 + 3 + 9 = 23$ days, so the median is the 12th value in order.

Running totals: 14 birds covers days 1–3, 15 covers 4–6, 16 covers 7–10, 17 covers day 11, and 18 covers days 12–14. The 12th value is 18.`,
  },
  {
    n: 3,
    skill: PCT,
    page: 74,
    stem: r`A researcher surveyed undergraduate students, graduate students, and postgraduate students. The number of undergraduate students surveyed was 7450% of the number of postdoctoral students surveyed and the number of graduate students surveyed was 24% of the undergraduate students surveyed. If there were 3576 graduate students surveyed, what was the sum of the number of undergraduate students and postdoctoral students surveyed?`,
    grid: ["15100"],
    explanation: r`Graduate students: $0.24u = 3576$, so $u = 14{,}900$ undergraduates.

Undergraduates: $74.5p = 14{,}900$, so $p = 200$ postdoctoral students.

Sum: $14{,}900 + 200 = 15{,}100$.`,
  },
  {
    n: 4,
    skill: ONE,
    page: 74,
    stem: r`Each of the three data sets represented by the three dot plots has 18 values. The median of data sets $A$, $B$, and $C$ are $a$, $b$, and $c$ respectively. What is the relationship between $a$, $b$, and $c$?

${fig("ps-4", 280)}`,
    choices: [r`$a < b < c$`, r`$c < b < a$`, r`$b < c < a$`, r`$a = b = c$`],
    answer: "D",
    explanation: r`With 18 values, each median is the mean of the 9th and 10th values.

- A: values up to 4 count $1 + 2 + 4 = 7$, and the five 5s are values 8–12. Median $a = 5$.
- B: values up to 4 count $3 + 4 = 7$, and the five 5s are values 8–12. Median $b = 5$.
- C: values up to 4 count $1 + 1 + 3 + 3 = 8$, and the three 5s are values 9–11. Median $c = 5$.

So $a = b = c$.`,
  },
  {
    n: 5,
    skill: ONE,
    page: 75,
    stem: r`The dot plot represents 13 values in data set A. Data set B is created by adding 39 to each of the values in data set A. Which of the following correctly compares the median and standard deviations of data sets A and B?

${fig("ps-5", 280)}`,
    choices: [
      r`The median of data set B is equal to the median of data set A, and the standard deviation of data set B is equal to the standard deviation of data set A.`,
      r`The median of data set B is greater than the median of data set A, and the standard deviation of data set B is equal to the standard deviation of data set A.`,
      r`The median of data set B is greater than the median of data set A, and the standard deviation of data set B is greater than the standard deviation of data set A.`,
      r`The median of data set B is less than the median of data set A, and the standard deviation of data set B is equal to the standard deviation of data set A.`,
    ],
    answer: "B",
    explanation: r`Adding 39 to every value moves the whole data set 39 to the right. The median moves with it, so B's median is 39 greater.

Spread doesn't change when every value moves by the same amount: each value keeps its distance from the mean, so the standard deviation stays the same.`,
  },
  {
    n: 6,
    skill: PCT,
    page: 75,
    stem: r`The positive number $a$ is 2,800% of the number $c$, and $c$ is 20% of the number $b$. What is the value of $a - b$ in terms of $c$?`,
    choices: [r`$23c$`, r`$140c$`, r`$560c$`, r`$2{,}240c$`],
    answer: "A",
    explanation: r`$a = 28c$.

$c = 0.2b$, so $b = 5c$.

$a - b = 28c - 5c = 23c$.`,
  },
  {
    n: 7,
    skill: OBS,
    page: 75,
    stem: r`A researcher selected 26 guinea pigs from one habitat and 18 wild cavies from another habitat at random in Venezuela. The researcher found that in early adolescence, the number of virtual squares the wild cavies crossed was significantly more than the number of virtual squares the guinea pigs crossed. The researcher also found that the number of virtual squares crossed by both the wild cavies and the guinea pigs decreased from early adolescence to late adolescence.

Based on the researcher's findings, which of the following statements is an appropriate conclusion that can be drawn from this study?`,
    choices: [
      r`The statistically significant difference in behavior between the two age groups was caused by the differences in habitat.`,
      r`The statistically significant difference in behavior between the two age groups was caused by aging.`,
      r`The statistically significant difference in behavior during early adolescence between the two groups of animals can be generalized to all guinea pigs and wild cavies.`,
      r`The statistically significant difference in behavior during early adolescence between the two groups of animals can only be generalized to the habitats in the study.`,
    ],
    answer: "D",
    explanation: r`This is an observational study: nothing was assigned, so it can't show what caused a difference (A and B are out).

The animals were chosen at random from one habitat each, so the result describes the animals in those two habitats. It can't be stretched to every guinea pig and wild cavy everywhere (C is out). Choice D.`,
  },
  {
    n: 8,
    skill: PCT,
    page: 75,
    stem: r`A real estate company offers a series of three webinars. 1,250 people attended the first webinar. 68% of the people who attended the first webinar attended the second webinar, and 32% of the people who attended the first and second webinars attended the third webinar. How many people attended all three webinars?`,
    grid: ["272"],
    explanation: r`First and second: $0.68 \times 1{,}250 = 850$.

All three: $0.32 \times 850 = 272$.`,
  },
  {
    n: 9,
    skill: ONE,
    page: 76,
    stem: r`Each of the following frequency tables represents a data set. Which of these frequency tables represents the data set with the smallest standard deviation?`,
    choices: [
      freq([[5, 0], [6, 10], [7, 55], [8, 10], [9, 0]]),
      freq([[5, 11], [6, 17], [7, 19], [8, 17], [9, 11]]),
      freq([[5, 15], [6, 15], [7, 15], [8, 18], [9, 15]]),
      freq([[5, 18], [6, 14], [7, 11], [8, 14], [9, 18]]),
    ],
    answer: "A",
    explanation: r`Standard deviation measures how far the values sit from the mean.

In A, 55 of the 75 values are exactly 7 and the rest are only 1 away, at 6 and 8. B, C and D spread their values across 5 to 9, and D even piles them at the ends. A is the most tightly packed.`,
  },
  {
    n: 10,
    skill: PCT,
    page: 76,
    stem: r`The positive number $a$ is 3,700% of the number $c$, and $c$ is 20% of the number $b$. If $a - b = wc$, where $w$ is a constant, what is the value of $w$?`,
    grid: ["32"],
    explanation: r`$a = 37c$.

$c = 0.2b$, so $b = 5c$.

$a - b = 37c - 5c = 32c$, so $w = 32$.`,
  },
  {
    n: 11,
    skill: OBS,
    page: 76,
    stem: r`Researchers must conduct an experiment to see whether a new vaccine is effective in relieving certain allergies. They have selected a random sample of 100 patients suffering from allergies. Some of the patients are assigned to the new vaccine while the rest are assigned to the traditional treatment. Which of the following methods of assigning each patient's treatment is most likely to lead to a reliable conclusion about the effectiveness of the new vaccine?`,
    choices: [
      r`Those who have more than one allergy are assigned to the new vaccine.`,
      r`The median weight of the patients is found. Those who weigh less than the median weight are assigned to the new vaccine.`,
      r`The patients divide themselves evenly into two groups. A coin is tossed to decide which group is assigned to the new vaccine.`,
      r`Each patient is given a random number. Those with an even number are assigned to the new vaccine.`,
    ],
    answer: "D",
    explanation: r`A reliable experiment assigns each patient to a treatment at random, so the two groups are alike except for the treatment.

A and B build the groups from a trait (number of allergies, weight) that could affect the result. In C the patients choose their own groups, so the groups may differ; the coin only picks which group gets the vaccine. D assigns every patient at random.`,
  },
  {
    n: 12,
    skill: ONE,
    page: 76,
    stem: r`$$a,\ 26,\ 29,\ b,\ 33,\ 49,\ c$$

For the given data set, the data values are listed in ascending order, where $a$, $b$, and $c$ are constants. For this data set, the mean is 36, the median is 29, and the range is 72. What is the value of $c$?`,
    choices: [r`53`, r`72`, r`79`, r`98`],
    answer: "C",
    explanation: r`There are 7 values, so the median is the 4th one: $b = 29$.

The mean is 36, so the values add up to $7 \times 36 = 252$:
$$a + 26 + 29 + 29 + 33 + 49 + c = 252 \quad\Rightarrow\quad a + c = 86$$

The range is $c - a = 72$. Adding the two equations: $2c = 158$, so $c = 79$.`,
  },
  {
    n: 13,
    skill: OBS,
    page: 77,
    stem: r`A biologist wanted to study the effectiveness of a fertilizer on the growth of corn seeds. The greenhouse was split down the middle: half A was treated with fertilizer, half B was not. The biologist obtained two 750-seed packages. The seeds from one package were planted in the soil treated by the fertilizer, and the seeds from the other package were planted in the soil not treated by the fertilizer. How should the experiment be changed to allow the researcher to conclude whether the fertilizer has an effect on the growth of corn seeds?`,
    choices: [
      r`No changes to the experiment are required.`,
      r`All 1,500 corn seeds should receive the fertilizer.`,
      r`One of the packages of corn seeds should be planted in a field rather than the greenhouse.`,
      r`Half of the seeds from each package should be randomly assigned to each half of the greenhouse.`,
    ],
    answer: "D",
    explanation: r`As set up, each package goes entirely to one half, so a difference in growth could come from the packages (different seeds) rather than the fertilizer.

Randomly assigning half of each package to each half of the greenhouse spreads both packages over both treatments. Then the fertilizer is the only systematic difference between the halves.`,
  },
  {
    n: 14,
    skill: ONE,
    page: 77,
    stem: r`Data set $A$ consists of 18 different values that have a minimum of 12, a maximum of 80, a mean of 46 and a standard deviation of 17. The values 12 and 80 are removed from the set to create data set $B$, which consists of 16 different values. Which of the following statements is true?`,
    choices: [
      r`The mean of data set $B$ is greater than 46.`,
      r`The mean of data set $B$ is less than 46.`,
      r`The standard deviation of data set $B$ is greater than 17.`,
      r`The standard deviation of data set $B$ is less than 17.`,
    ],
    answer: "D",
    explanation: r`Mean: $A$ adds up to $18 \times 46 = 828$. Removing $12 + 80 = 92$ leaves $736$ over 16 values, a mean of $46$. The mean doesn't change, so A and B are out.

Standard deviation: 12 and 80 are each 34 from the mean, twice the standard deviation of 17, and they were the most extreme values. Removing them leaves values that sit closer to the mean on average, so the standard deviation decreases.`,
  },
  {
    n: 15,
    skill: ONE,
    page: 77,
    stem: r`Each of the following frequency tables represents a data set. Which data set has the greatest mean?`,
    choices: [
      freq([[60, 2], [70, 3], [80, 4], [90, 5]]),
      freq([[60, 6], [70, 3], [80, 3], [90, 6]]),
      freq([[60, 4], [70, 4], [80, 4], [90, 4]]),
      freq([[60, 5], [70, 4], [80, 4], [90, 5]]),
    ],
    answer: "A",
    explanation: r`B, C and D are symmetric around 75 (each value below 75 is matched by one the same distance above), so each has a mean of 75.

A leans toward the high values:
$$\frac{60(2) + 70(3) + 80(4) + 90(5)}{2 + 3 + 4 + 5} = \frac{1100}{14} \approx 78.6$$

A has the greatest mean.

Note: the book's key says D, whose mean is 75.`,
  },
  {
    n: 16,
    skill: PCT,
    page: 77,
    stem: r`The positive number $a$ is 480% of the number $b$, and $a$ is 70% of the number $c$. If $c$ is $p\%$ of $b$, which of the following is closest to the value of $p$?`,
    choices: [r`267`, r`336`, r`550`, r`685`],
    answer: "D",
    explanation: r`$a = 4.8b$ and $a = 0.7c$, so
$$c = \frac{a}{0.7} = \frac{4.8b}{0.7} \approx 6.857b$$

$c$ is about 685.7% of $b$. The closest choice is 685.`,
  },
  {
    n: 17,
    skill: ONE,
    page: 78,
    stem: r`Harold is writing a book. To finish by his deadline, he needs to write an average of 3,000 words per week for 4 weeks. He wrote 4,500 words in the first week, 2,800 words in the second week, and 2,400 words in the third week. Which inequality represents the number of words, $x$, Harold needs to write in the 4th week to meet or exceed his goal?`,
    choices: [
      r`$4{,}500 + 2{,}800 + 2{,}400 + x \ge 4(3{,}000)$`,
      r`$\dfrac{4{,}500 + 2{,}800 + 2{,}400}{3} + x \ge 3{,}000$`,
      r`$4{,}500 + 2{,}800 + 2{,}400 \ge x(3{,}000)$`,
      r`$\dfrac{4{,}500}{4} + \dfrac{2{,}800}{4} + \dfrac{2{,}400}{4} + x \ge 3{,}000$`,
    ],
    answer: "A",
    explanation: r`An average of at least 3,000 words over 4 weeks means at least $4(3{,}000)$ words in total.

The total is the three weeks so far plus $x$: $4{,}500 + 2{,}800 + 2{,}400 + x \ge 4(3{,}000)$.`,
  },
  {
    n: 18,
    skill: PCT,
    page: 78,
    stem: r`The mass of object A is 450% of the mass of object B, and the mass of object A is 0.090% of the mass of object C. If the mass of object C is $p\%$ of the mass of object B, what is the value of $\dfrac{p}{1{,}000}$?`,
    grid: ["500"],
    explanation: r`$A = 4.5B$ and $A = 0.0009C$, so
$$C = \frac{A}{0.0009} = \frac{4.5B}{0.0009} = 5{,}000B$$

$C$ is $500{,}000\%$ of $B$, so $p = 500{,}000$ and $\dfrac{p}{1{,}000} = 500$.`,
  },
  {
    n: 19,
    skill: ONE,
    page: 78,
    stem: r`Data set A contains 23 positive integers and has mean score of 83. The highest and two lowest values in data set A are removed to create data set B. The average of data set B is 87. What is the greatest possible range of the 3 values that were removed to create data set B?`,
    grid: ["166"],
    explanation: r`Data set A adds up to $23 \times 83 = 1{,}909$. Data set B has 20 values adding up to $20 \times 87 = 1{,}740$.

The three removed values add up to $1{,}909 - 1{,}740 = 169$.

Their range is the highest minus the lowest. To make it as large as possible, make the two lowest values as small as possible: both are positive integers, so both can be 1. Then the highest is $169 - 2 = 167$, and the range is $167 - 1 = 166$.`,
  },
  {
    n: 20,
    skill: ONE,
    page: 78,
    stem: r`Each of the following frequency tables represents a data set. Which of these frequency tables represents the data set with the smallest standard deviation?`,
    choices: [
      freq([[4, 0], [5, 10], [6, 40], [7, 10], [8, 0]]),
      freq([[4, 8], [5, 14], [6, 16], [7, 14], [8, 8]]),
      freq([[4, 12], [5, 12], [6, 12], [7, 12], [8, 12]]),
      freq([[4, 15], [5, 11], [6, 8], [7, 11], [8, 15]]),
    ],
    answer: "A",
    explanation: r`All four are centered at 6. In A, 40 of the 60 values are exactly 6 and the rest are only 1 away. The others put values as far out as 4 and 8, and D piles them there. A is the most tightly packed, so it has the smallest standard deviation.`,
  },
  {
    n: 21,
    skill: INF,
    page: 79,
    stem: r`For a poll, an organizer randomly selected 21 professors from a certain liberal arts program at a university. These professors were asked whether they were interested in using a new textbook for their classes, and 14 of them responded "Yes." What is the largest group to which the results of the poll can be generalized?`,
    choices: [
      r`The 14 professors who responded "Yes"`,
      r`All liberal arts professors at the university`,
      r`All professors in the program`,
      r`All professors at the university`,
    ],
    answer: "C",
    explanation: r`A random sample represents the group it was drawn from. The 21 professors were chosen at random from one liberal arts program, so the results describe all professors in that program, and no larger group.`,
  },
  {
    n: 22,
    skill: PCT,
    page: 79,
    stem: r`The result of increasing a positive quantity by 11% is $x$. Which expression represents the original quantity in terms of $x$?`,
    choices: [
      r`$1.11x$`,
      r`$\dfrac{x}{1.11}$`,
      r`$1.11\left(\dfrac{100 + x}{100}\right)$`,
      r`$1.11\left(\dfrac{100}{100 + x}\right)$`,
    ],
    answer: "B",
    explanation: r`Increasing a quantity $q$ by 11% multiplies it by 1.11: $1.11q = x$.

So $q = \dfrac{x}{1.11}$.`,
  },
  {
    n: 23,
    skill: PCT,
    page: 79,
    stem: r`While the mass of an object is the same everywhere, the weight of an object is not the same on different planets. An object has a weight of 170.00 pounds on Earth and a weight of 186.32 pounds on Neptune. The object's weight on Jupiter is 252.8% of its weight on Earth. If the object's weight on Neptune is $x\%$ of its weight on Jupiter, which of the following is closest to the value of $x$?`,
    choices: [r`43.35`, r`71.73`, r`277.07`, r`429.76`],
    answer: "A",
    explanation: r`Weight on Jupiter: $2.528 \times 170 = 429.76$ pounds.

Neptune as a percent of Jupiter:
$$x = \frac{186.32}{429.76} \times 100 \approx 43.35$$`,
  },
  {
    n: 24,
    skill: PCT,
    page: 79,
    stem: r`The mass of object $A$ is 483% of the mass of object $B$, and the mass of object $A$ is 0.069% of the mass of object $C$. If the mass of object $C$ is $p\%$ of the mass of object $B$, what is the value of $\dfrac{p}{1{,}000}$?`,
    grid: ["700"],
    explanation: r`$A = 4.83B$ and $A = 0.00069C$, so
$$C = \frac{4.83B}{0.00069} = 7{,}000B$$

$C$ is $700{,}000\%$ of $B$, so $\dfrac{p}{1{,}000} = 700$.`,
  },
  {
    n: 25,
    skill: PCT,
    page: 79,
    stem: r`The value of a video game console increased by 285% from the end of 2015 to the end of 2016. The value of the console then decreased by 21% from the end of 2016 to the end of 2017. Finally, the value of the console increased by 63% from the end of 2017 to the end of 2018. What was the net percentage increase in the value of the video game console from the end of 2015 to the end of 2018? (Round to the nearest tenth of a percent)`,
    grid: ["395.8"],
    explanation: r`Each change multiplies the value: up 285% is $\times 3.85$, down 21% is $\times 0.79$, up 63% is $\times 1.63$.
$$3.85 \times 0.79 \times 1.63 = 4.957645$$

The value ended at 495.7645% of where it started, a net increase of about $395.8\%$.

Note: the book asks for the nearest hundredth (395.76), which has six characters; the answer box holds five, so this version asks for the nearest tenth.`,
  },
  {
    n: 26,
    skill: ONE,
    page: 79,
    stem: r`Ashley wanted to save an average of \$20 per week over the past 15 weeks. For the first 5 weeks, she saved an average of \$15 per week. For the next 5 weeks, she saved an average of \$19 per week. For the last 5 weeks, she saved an average of \$23 per week. How much more should she have saved each week to hit her goal?`,
    choices: [r`\$0.75`, r`\$0.80`, r`\$1.00`, r`\$1.50`],
    answer: "C",
    explanation: r`Goal: $15 \times 20 = \$300$.

Saved: $5(15) + 5(19) + 5(23) = 75 + 95 + 115 = \$285$.

She was \$15 short over 15 weeks, which is $\$1.00$ more each week.`,
  },
  {
    n: 27,
    skill: PCT,
    page: 80,
    stem: r`In a collection of items, 10% are red, 25% are green, 35% are blue, and 30% are yellow. If there are 40 green items, how many blue items are in the collection?`,
    choices: [r`14`, r`16`, r`48`, r`56`],
    answer: "D",
    explanation: r`25% of the collection is 40 items, so the collection has $40 \div 0.25 = 160$ items.

Blue: $0.35 \times 160 = 56$.`,
  },
  {
    n: 28,
    skill: ONE,
    page: 80,
    stem: r`A data set consists of 5 numbers. The minimum is 5 and the range is 25. If we delete the minimum the median will not change, but if we delete the maximum the median will decrease by 1 unit. If the mean of the data set is 15, what is the median of the data set?`,
    grid: ["14"],
    explanation: r`Write the numbers in order as $5, b, m, d, 30$ (the maximum is $5 + 25 = 30$). The median is $m$.

Delete the minimum: the median of $b, m, d, 30$ is $\dfrac{m + d}{2}$. It equals $m$, so $d = m$.

Delete the maximum: the median of $5, b, m, d$ is $\dfrac{b + m}{2} = m - 1$, so $b = m - 2$.

The mean is 15, so the numbers add up to 75:
$$5 + (m - 2) + m + m + 30 = 75 \quad\Rightarrow\quad 3m = 42 \quad\Rightarrow\quad m = 14$$

Check: $5, 12, 14, 14, 30$. Without 5 the median is 14; without 30 it's 13.

Note: the book's key says 13, the median after the maximum is removed.`,
  },
  {
    n: 29,
    skill: INF,
    page: 80,
    stem: r`A development company is advertising that the mean area of the apartments in a new complex is 1,450 square feet. The complex consists of 10 buildings with a total of 1,000 apartments. A sample of 50 apartments will be selected from the complex to test the company's statement about the mean apartment area. Which of the following is an unbiased sampling method?`,
    choices: [
      r`Select the first 50 apartments built.`,
      r`Select the first 50 apartments that are occupied.`,
      r`Select at random 5 top-floor apartments from each of the buildings.`,
      r`Select at random 50 apartments from all the apartments in the 10 buildings.`,
    ],
    answer: "D",
    explanation: r`An unbiased sample gives every apartment the same chance of being picked.

The first ones built or occupied could differ in size from the rest, and top-floor apartments may be larger or smaller than others. Only D picks at random from all 1,000 apartments.`,
  },
  {
    n: 30,
    skill: OBS,
    page: 80,
    stem: r`To determine if eating chocolate has an effect on men's standardized test scores, researchers surveyed a random population of 8,000 men. Study participants were identified as regular chocolate eaters or non-chocolate eaters and were given a standardized test. They found that the regular chocolate eaters had higher scores than the non-chocolate eaters. What is the most appropriate conclusion for this study?`,
    choices: [
      r`Eating chocolate regularly causes higher standardized test scores for men and women.`,
      r`Eating chocolate regularly causes higher standardized test scores for men but not necessarily for women.`,
      r`There is an association between eating chocolate and higher standardized test scores for men and women, but it is not necessarily a cause-and-effect relationship.`,
      r`There is an association between eating chocolate and higher standardized test score for men, but it is not necessarily a cause-and-effect relationship and it does not necessarily exist for women.`,
    ],
    answer: "D",
    explanation: r`The men chose whether to eat chocolate; the researchers didn't assign it. That makes this an observational study, which shows an association but not cause and effect (A and B are out).

Only men were sampled, so the result can't be extended to women (C is out).`,
  },
  {
    n: 31,
    skill: PCT,
    page: 80,
    stem: r`For the positive quantities $h$, $j$, and $k$, 94% of $h$ is equivalent to 47% of $j$, and $j$ is equivalent to 30% of $k$. What percentage of $k$ is $h$? (Disregard the % sign when entering your answer. For example, if your answer is 39%, enter 39).`,
    grid: ["15"],
    explanation: r`$0.94h = 0.47j$, so $h = 0.5j$.

$j = 0.3k$, so $h = 0.5(0.3k) = 0.15k$. $h$ is 15% of $k$.`,
  },
  {
    n: 32,
    skill: OBS,
    page: 81,
    stem: r`To study the effect of magnesium supplementation on the sleep quality of adults, a researcher selected 190 adults at random from a community center to participate in a study. Each participant was randomly assigned to take a magnesium supplement or a placebo each day for 6 weeks. At the end of the 6 weeks, the researcher found that the magnesium supplement caused statistically significant improved sleep quality. What feature of this study allowed the researcher to conclude that the magnesium supplement caused the improved sleep quality?`,
    choices: [
      r`There were more than 100 participants in the study.`,
      r`The participants were selected at random from the community center.`,
      r`The sleep efficiency of each participant was measured again at the end of 6 weeks.`,
      r`Each participant was randomly assigned to take a magnesium supplement or a placebo.`,
    ],
    answer: "D",
    explanation: r`Cause and effect needs random assignment to the treatments. It makes the two groups alike apart from the supplement, so a difference in sleep can be put down to the supplement.

Random selection (B) lets the results extend to the community center's adults, but it doesn't show cause.

Note: the book's text starts mid-word ("ffect of magnesium…"), so the opening words were restored.`,
  },
  {
    n: 33,
    skill: ONE,
    page: 81,
    stem: r`80 people each bowled one game at Brick Alley Bowling last Friday. 60 people scored between 50 and 100, 18 people scored between 101 and 185, and the remaining two players bowled a score between 280 and 300. Which of the following statements about the mean and median of the 80 scores is true?`,
    choices: [
      r`The mean is less than the median.`,
      r`The median is less than the mean.`,
      r`The median and mean are equal.`,
      r`There is not enough information to determine whether the mean or median is greater.`,
    ],
    answer: "D",
    explanation: r`The median is the mean of the 40th and 41st scores, which are among the 60 scores from 50 to 100. Where it lands depends on how those 60 scores are spread.

- If all 60 scored 100, 18 scored 101 and 2 scored 280, the median is 100 and the mean is $\dfrac{6{,}000 + 1{,}818 + 560}{80} \approx 104.7$: the median is less.
- If 39 scored 50, 21 scored 100, 18 scored 101 and 2 scored 280, the median is still 100 but the mean is $\dfrac{1{,}950 + 2{,}100 + 1{,}818 + 560}{80} \approx 80.4$: the mean is less.

Both fit the description, so it can't be determined.

Note: the book's key says B, reasoning that the few high scores pull the mean above the median. That's typical, but the ranges given don't guarantee it.`,
  },
  {
    n: 34,
    skill: INF,
    page: 81,
    stem: r`A researcher conducted a study to determine if certain memorization strategies could improve the performance of chess players. For the study, the researcher selected a random sample of adults who are competing in a chess tournament. At the end of the study, 80% of those sampled reported that they did not find the memorization strategies to be useful during their chess games. Which of the following is the largest population to which the results of this study can be applied?`,
    choices: [
      r`All chess players who compete in tournaments`,
      r`All adults who compete in chess tournaments`,
      r`All chess players competing in the tournament`,
      r`All adults competing in the tournament`,
    ],
    answer: "D",
    explanation: r`The sample was drawn at random from the adults competing in one tournament, so the results apply to that group: all adults competing in the tournament. Players under 18 and other tournaments weren't sampled.`,
  },
  {
    n: 35,
    skill: RAT,
    page: 81,
    stem: r`John and Karen work at the bakery. John works 7 hours per day, and Karen works 6 hours per day. John produces $x$ brownies per hour and Karen produced $y$ brownies per hour. Which of the following expressions gives the average number of brownies John and Karen produce per hour?`,
    choices: [r`$\dfrac{x + y}{13}$`, r`$\dfrac{7x + 6y}{13}$`, r`$\dfrac{xy}{13}$`, r`$\dfrac{6x + 7y}{13}$`],
    answer: "B",
    explanation: r`In a day John makes $7x$ brownies and Karen makes $6y$, over $7 + 6 = 13$ hours of work.

Average per hour: $\dfrac{7x + 6y}{13}$.`,
  },
  {
    n: 36,
    skill: ONE,
    page: 82,
    stem: r`Each of the following frequency tables represents a data set. Which of these frequency tables represents the data set with the smallest standard deviation?`,
    choices: [
      freq([[3, 0], [4, 10], [5, 55], [6, 10], [7, 0]]),
      freq([[3, 11], [4, 17], [5, 19], [6, 17], [7, 11]]),
      freq([[3, 15], [4, 15], [5, 15], [6, 15], [7, 15]]),
      freq([[3, 17], [4, 15], [5, 11], [6, 15], [7, 17]]),
    ],
    answer: "A",
    explanation: r`All four are centered at 5. In A, 55 of the 75 values are exactly 5 and the rest are only 1 away. The others spread out to 3 and 7, and D piles values there. A has the smallest standard deviation.`,
  },
  {
    n: 38,
    skill: PCT,
    page: 82,
    stem: r`The composition of an animal is defined as the muscles, bones, and fat of the animal. A scientist studied the composition of one young swamp buffalo and determined that the buffalo had 139.2 kilograms of muscle, which made up approximately 67.7% of its composition. Of the remaining composition of this buffalo, approximately 51.4% was bone, and the remainder was fat. Based on these approximations, to the nearest tenth, how many kilograms of this buffalo's composition was bone?`,
    grid: ["34.1"],
    explanation: r`Whole composition: $139.2 \div 0.677 \approx 205.61$ kg.

The rest: $205.61 - 139.2 \approx 66.41$ kg.

Bone: $0.514 \times 66.41 \approx 34.1$ kg.`,
  },
  {
    n: 39,
    skill: PCT,
    page: 82,
    stem: r`A clothing store buys shirts at a wholesale price of 5.00 dollars each and resells them each at a price that is 270% of the wholesale price. At the end of the season, any remaining shirts are marked at a discounted price that is 70% of the retail price. What is the discounted price of each remaining shirt, in dollars?`,
    grid: ["9.45"],
    explanation: r`Retail: $2.7 \times 5.00 = 13.50$ dollars.

Discounted: $0.7 \times 13.50 = 9.45$ dollars.`,
  },
  {
    n: 40,
    skill: PCT,
    page: 82,
    stem: r`A juice mixture has a total volume of 125 liters and is 45% juice by volume. The mixture was created by mixing two different solutions (solution A and solution B). Solution A was 24% juice by volume. Solution B was 64% juice by volume. The volume, in liters, of juice in solution A is equal to $a$. The volume, in liters, of juice in solution B is equal to $b$. The numbers $a$, $b$, and $p$ are all positive constants. If $a$ is $p\%$ less than $b$, what is the value of $p$? (Round your answer to the nearest hundredth)`,
    grid: ["66.07", "925/14"],
    explanation: r`Let $A$ and $B$ be the volumes of the two solutions. Then $A + B = 125$, and the juice adds up to $0.45 \times 125 = 56.25$:
$$0.24A + 0.64B = 56.25$$

Substituting $A = 125 - B$: $30 + 0.4B = 56.25$, so $B = 65.625$ and $A = 59.375$.

Juice: $a = 0.24 \times 59.375 = 14.25$ and $b = 0.64 \times 65.625 = 42$.
$$p = \frac{42 - 14.25}{42} \times 100 \approx 66.07$$`,
  },
  {
    n: 41,
    skill: PCT,
    page: 82,
    stem: r`A set of five consecutive even integers is ordered from least to greatest. The sum of the first and fourth even integers is 5,860% more than the quotient of the fifth even integer and 30. The first even integer is $p\%$ less than the fifth even integer, where $p$ is a constant. What is the value $p$?`,
    grid: ["16/15", "1.07"],
    explanation: r`Call the integers $n, n + 2, n + 4, n + 6, n + 8$.

5,860% more than a number is $59.6$ times it:
$$n + (n + 6) = 59.6 \cdot \frac{n + 8}{30}$$
$$60n + 180 = 59.6n + 476.8 \quad\Rightarrow\quad 0.4n = 296.8 \quad\Rightarrow\quad n = 742$$

The fifth integer is 750, so
$$p = \frac{750 - 742}{750} \times 100 = \frac{16}{15} \approx 1.07$$`,
  },
  {
    n: 42,
    skill: ONE,
    page: 83,
    stem: r`A digital marketing agency has three groups of clients. The first group consists of 8 clients who are charged a monthly fee of at least \$170 but no more than \$190. The second group consists of 11 clients who are charged a monthly fee of at least \$200 but no more than \$230. The third group consists of 21 clients who are charged a monthly fee of at least \$240 but no more than \$300. If a new client who is charged a monthly fee of \$250 is added to the third group, what will be the effect on the mean monthly fee charged by the agency?`,
    choices: [
      r`The mean will increase.`,
      r`The mean will decrease.`,
      r`The mean will remain the same.`,
      r`There is not enough information to determine how the mean will change.`,
    ],
    answer: "D",
    explanation: r`Adding a value raises the mean if it's above the current mean and lowers it if it's below.

The 40 current clients' mean is at least
$$\frac{8(170) + 11(200) + 21(240)}{40} = \frac{8{,}600}{40} = \$215$$
and at most
$$\frac{8(190) + 11(230) + 21(300)}{40} = \frac{10{,}350}{40} = \$258.75$$

\$250 lies inside that range, so the mean could go either way.

Note: the book's key says B, which would need the current mean to be above \$250.`,
  },
  {
    n: 43,
    skill: PCT,
    page: 83,
    stem: r`A chemist mixed $x$ liters of a 2% saline solution with $y$ liters of a 5% saline solution to produce a 3% saline solution. Which equation best represents this situation? (Assume the volumes of the solutions are additive.)`,
    choices: [
      r`$0.02x + 0.05y = 3(x + y)$`,
      r`$0.02x + 0.05y = 0.03(x + y)$`,
      r`$0.2x + 0.5y = 3(x + y)$`,
      r`$0.2x + 0.5y = 0.3(x + y)$`,
    ],
    answer: "B",
    explanation: r`The salt in the two solutions is $0.02x$ and $0.05y$ liters. The mixture has $x + y$ liters and is 3% salt, so it holds $0.03(x + y)$ liters of salt:
$$0.02x + 0.05y = 0.03(x + y)$$`,
  },
  {
    n: 44,
    skill: PCT,
    page: 83,
    stem: r`On a plot of land, 52.0% of the square footage is farmland and the remaining square footage is pasture. There are buildings on exactly 21.5% of the square footage of the farmland, and there are buildings on exactly 14.0% of the square footage of the pasture. If there are buildings on exactly $p\%$ of the square footage of the plot of land, what is the value of $p$?`,
    grid: ["17.9"],
    explanation: r`Pasture is $100\% - 52.0\% = 48.0\%$ of the land.

Buildings, as a share of the whole plot:
$$0.52(21.5) + 0.48(14.0) = 11.18 + 6.72 = 17.9$$`,
  },
  {
    n: 45,
    skill: ONE,
    page: 83,
    stem: r`The standard deviation of data set $A$ is $x$, and the standard deviation of data set $B$ is $y$.

**Data Set $A$:** 19, 19, 21, 21, 23, 24, 24
**Data Set $B$:** 1, 1, 3, 3, 5, 6, 6

Which of the following statements about the standard deviation of the data sets is true?`,
    choices: [r`$x > y$`, r`$x = y$`, r`$x < y$`, r`The relationship between $x$ and $y$ cannot be determined.`],
    answer: "B",
    explanation: r`Each value in $B$ is the matching value in $A$ minus 18. Shifting every value by the same amount doesn't change how spread out they are, so $x = y$.`,
  },
  {
    n: 46,
    skill: PCT,
    page: 83,
    stem: r`The value of an autographed baseball increased by 178% from the end of 2012 to the end of 2013 and then decreased by 21% from the end of 2013 to the end of 2014. What was the net percentage increase in the value of the autographed baseball from the end of 2012 to the end of 2014?`,
    choices: [r`119.62%`, r`140.62%`, r`157.00%`, r`236.38%`],
    answer: "A",
    explanation: r`Up 178% multiplies by 2.78, and down 21% multiplies by 0.79:
$$2.78 \times 0.79 = 2.1962$$

The value is 219.62% of the start, a net increase of 119.62%.`,
  },
  {
    n: 47,
    skill: PCT,
    page: 84,
    stem: r`A field study tracked two animal populations: lions and antelopes. At the start of a week, the two populations were equal in number. By the end of the week, the number of antelopes had increased by 2106% of its starting number, and the number of lions had increased by 300% of its starting number. At the end of the week, the number of antelopes was $p\%$ greater than the number of lions. What is the value of $p$?`,
    grid: ["451.5"],
    explanation: r`Call the starting number $N$. Antelopes end at $N + 21.06N = 22.06N$, and lions at $N + 3N = 4N$.
$$p = \frac{22.06N - 4N}{4N} \times 100 = 451.5$$`,
  },
  {
    n: 48,
    skill: ONE,
    page: 84,
    stem: r`The graph below shows the distribution of all stars within 12 light-years of Earth by total energy output per second, or luminosity.

${fig("ps-48", 300)}

Which of the following could be the median luminosity of all the stars within 12 light-years of Earth?`,
    choices: [r`0.18`, r`0.052`, r`0.0063`, r`0.0003`],
    answer: "C",
    explanation: r`There are $1 + 3 + 6 + 5 + 7 + 9 = 31$ stars, so the median is the 16th in order.

From the lowest luminosity: the 9 stars below 0.001 are 1st–9th, and the 7 stars from 0.001 to 0.01 are 10th–16th. The median is between 0.001 and 0.01, and 0.0063 is the only choice there.`,
  },
  {
    n: 49,
    skill: ONE,
    page: 84,
    stem: r`The histograms shown summarize two data sets, $X$ and $Y$. Each data set consists of 25 whole numbers. In each histogram, the first interval represents the frequency of whole numbers greater than or equal to 70, but less than 75. The second interval represents the frequency of whole numbers greater than or equal to 75, but less than 80, and so on. What is the **largest possible difference** between the median of data set $Y$ and the mean of data set $X$?

${fig("ps-49", 260)}`,
    grid: ["18"],
    explanation: r`To make the difference largest, make $Y$'s median as large and $X$'s mean as small as possible.

Median of $Y$: the 13th of 25 values. The first two bars hold $4 + 6 = 10$ values, so the 13th is in the 90–95 bar. The largest whole number there is 94.

Smallest mean of $X$: put every value at the bottom of its bar:
$$\frac{9(70) + 6(75) + 6(80) + 4(85)}{25} = \frac{1{,}900}{25} = 76$$

Difference: $94 - 76 = 18$.`,
  },
  {
    n: 50,
    skill: PCT,
    page: 85,
    stem: r`The speeds of particles $A$, $B$, and $C$ are $a$ meters per second, $b$ meters per second, and $c$ meters per second, respectively. If the speed of particle $A$ is 6,000% of the speed of particle $C$ and the speed of particle $C$ is 0.008% of the speed of particle $B$, which expression represents the value of $a + b$ in terms of $c$?`,
    choices: [r`$12{,}560c$`, r`$6{,}125c$`, r`$6{,}008c$`, r`$1{,}850c$`],
    answer: "A",
    explanation: r`$a = 60c$.

$c = 0.00008b$, so $b = \dfrac{c}{0.00008} = 12{,}500c$.

$a + b = 60c + 12{,}500c = 12{,}560c$.`,
  },
  {
    n: 51,
    skill: ONE,
    page: 85,
    stem: r`Data set A consists of 20 different values that have a minimum of 22, a maximum of 86, a mean of 54, and a standard deviation of 15. The values 22 and 86 are removed from the set to create data set B, which consists of 18 different values. Which of the following statements is true?`,
    choices: [
      r`The mean of data set $B$ is greater than 54.`,
      r`The mean of data set $B$ is less than 54.`,
      r`The standard deviation of data set $B$ is greater than 15.`,
      r`The standard deviation of data set $B$ is less than 15.`,
    ],
    answer: "D",
    explanation: r`Mean: A adds up to $20 \times 54 = 1{,}080$. Removing $22 + 86 = 108$ leaves $972$ over 18 values, still a mean of 54.

Standard deviation: 22 and 86 are each 32 from the mean, more than twice the standard deviation, and they were the two most extreme values. Without them the remaining values sit closer to the mean on average, so the standard deviation goes down.`,
  },
  {
    n: 52,
    skill: ONE,
    page: 85,
    stem: r`A data set of 27 different numbers has a mean of 18 and a median of 18. A new data set is created by adding 20 to all of the values greater than the median while leaving all other numbers in the data set unchanged. Which of the following values will not change?`,
    choices: [r`Mean`, r`Range`, r`Median`, r`Sum of the numbers`],
    answer: "C",
    explanation: r`With 27 different numbers, the median is the 14th in order. The 13 numbers above it all go up by 20, so they stay above it, and the 14th number is unchanged. The median stays 18.

The sum (and so the mean) goes up by $13 \times 20 = 260$, and the maximum goes up by 20, which raises the range.`,
  },
  {
    n: 53,
    skill: TWO,
    page: 85,
    stem: r`A survey of 500 adults finds a correlation coefficient of 0.7 between the number of hours spent reading per week and their vocabulary test scores. The survey also reports that 60% of participants read more than 5 hours per week, with a margin of error of $\pm 5\%$. Which conclusion is most appropriate?`,
    choices: [
      r`Reading more hours per week causes higher vocabulary scores.`,
      r`There is a strong positive relationship between reading hours and vocabulary scores, but causation cannot be determined.`,
      r`Between 55% and 65% of adults read more than 5 hours per week, and this improves their vocabulary.`,
      r`The correlation of 0.7 means 70% of vocabulary scores are explained by reading hours.`,
    ],
    answer: "B",
    explanation: r`A correlation of 0.7 is a fairly strong positive relationship. A survey only observes, so it can't show that reading causes the higher scores (A and C claim cause).

D misreads the coefficient: $r = 0.7$ isn't "70% explained". The share explained is $r^2 = 0.49$.`,
  },
  {
    n: 54,
    skill: PCT,
    page: 86,
    stem: r`The composition of an animal is defined as the muscles, bones, and fat of the animal. A scientist studied the composition of one young swamp buffalo and determined that the buffalo had 133 kilograms of muscle, which made up approximately 65.9% of its composition. Of the remaining composition of this buffalo, approximately 46.2% was bone, and the remainder was fat. Based on these approximations, to the nearest tenth, how many kilograms of this buffalo's composition was bone?`,
    grid: ["31.8"],
    explanation: r`Whole composition: $133 \div 0.659 \approx 201.82$ kg.

The rest: $201.82 - 133 \approx 68.82$ kg.

Bone: $0.462 \times 68.82 \approx 31.8$ kg.`,
  },
  {
    n: 55,
    skill: ONE,
    page: 86,
    stem: r`A data set of 77 different numbers has a mean of 1,073. A new data set is created by adding 93 to each number in the original data set that is greater than the median and subtracting 93 from each number in the original data set that is less than the median. Which of the following measures does NOT have the same value in both the original and the new data sets?`,
    choices: [r`Sum of the numbers`, r`Mean`, r`Standard deviation`, r`Median`],
    answer: "C",
    explanation: r`The median is the 39th of 77 numbers, with 38 above it and 38 below.

- The 38 above go up by 93 and the 38 below go down by 93, so the sum changes by $38(93) - 38(93) = 0$. The sum and mean stay the same.
- The 39th number isn't changed and stays in the middle, so the median stays the same.
- Every other number moves 93 further from the middle, so the values spread out and the standard deviation increases.`,
  },
  {
    n: 56,
    skill: ONE,
    page: 86,
    stem: r`There are 50 unique numbers in a data set. If the value of each number increases by 25%, which of the following will be true?`,
    choices: [
      r`The new mean will remain the same, but the new standard deviation will be 25% more than the previous standard deviation.`,
      r`The new mean will be 25% more than the previous mean, but the standard deviation will remain the same.`,
      r`The new mean will be 25% more than the previous mean, but the standard deviation will increase.`,
      r`Neither the mean nor the standard deviation of the values will change.`,
    ],
    answer: "C",
    explanation: r`Increasing each number by 25% multiplies it by 1.25. The mean is multiplied by 1.25 too, so it is 25% more.

The gaps between the numbers are also multiplied by 1.25, so they spread out and the standard deviation increases (by 25% as well).`,
  },
  {
    n: 57,
    skill: PCT,
    page: 86,
    stem: r`The mass of object A is 144% of the mass of object B, and the mass of object A is 0.740% of the mass of object C. If the mass of object C is $p\%$ of the mass of object B, what is the value of $p$? (Round your answer to the nearest whole number.)`,
    grid: ["19459"],
    explanation: r`$A = 1.44B$ and $A = 0.0074C$, so
$$C = \frac{1.44B}{0.0074} \approx 194.5946B$$

$C$ is about $19{,}459.46\%$ of $B$, so $p \approx 19{,}459$.

Note: the book's key says 0.1872, which doesn't fit the question as printed; the rounding instruction was added so the answer fits the box.`,
  },
  {
    n: 58,
    skill: INF,
    page: 86,
    stem: r`A nutritionist wants to conduct a survey to estimate the mean number of servings of vegetables eaten by a certain group of people each day. The nutritionist has not yet decided which group of people to survey. Surveying a random sample from which of the following groups would most likely result in the smallest margin of error?`,
    choices: [
      r`Residents of the same city`,
      r`Customers of a certain restaurant`,
      r`Viewers of the same television show`,
      r`Students who are following the same daily diet plan`,
    ],
    answer: "D",
    explanation: r`For a sample of a given size, the margin of error is smaller when the values vary less within the group.

People on the same daily diet plan eat similar amounts of vegetables, so their servings vary the least. The other groups mix people with all kinds of eating habits.`,
  },
  {
    n: 59,
    skill: PCT,
    page: 86,
    stem: r`The value of a collectible comic book increased by 167% from the end of 2011 to the end of 2012 and then decreased by 16% from the end of 2012 to the end of 2013. What was the net percentage increase in the value of the collectible comic book from the end of 2011 to the end of 2013?`,
    choices: [r`124.28%`, r`140.28%`, r`151.00%`, r`209.72%`],
    answer: "A",
    explanation: r`Up 167% multiplies by 2.67, and down 16% multiplies by 0.84:
$$2.67 \times 0.84 = 2.2428$$

The value is 224.28% of the start, a net increase of 124.28%.`,
  },
  {
    n: 61,
    skill: INF,
    page: 87,
    stem: r`The principal of a local high school is conducting a survey on whether students felt online learning was still effective during the COVID-19 pandemic. Of the 200 students who were randomly sampled, 43% felt that online learning is still effective. Based on the margin of error, the principal expects that somewhere between 35% and 51% of all students feel that online learning is still effective during the COVID-19 pandemic. What is the margin of error?`,
    choices: [r`43%`, r`16%`, r`8%`, r`2%`],
    answer: "C",
    explanation: r`The interval is the estimate plus or minus the margin of error: $43\% - 8\% = 35\%$ and $43\% + 8\% = 51\%$.

The margin of error is 8%, half the width of the interval (16%).`,
  },
  {
    n: 63,
    skill: ONE,
    page: 87,
    stem: r`For which of the following sets of 9 data points is the median less than the mean?`,
    choices: [fig("ps-63-a", 300), fig("ps-63-b", 300), fig("ps-63-c", 300), fig("ps-63-d", 300)],
    answer: "A",
    explanation: r`With 9 points, the median is the 5th in order.

- A: $1, 1, 1, 1, 2, 2, 3, 4, 5$. Median 2, mean $\tfrac{20}{9} \approx 2.2$. The median is less.
- B: $1, 2, 3, 3, 4, 4, 4, 5, 5$. Median 4, mean $\tfrac{31}{9} \approx 3.4$.
- C: $1, 2, 2, 3, 3, 3, 4, 4, 5$. Symmetric, so median and mean are both 3.
- D: $1, 2, 3, 4, 4, 5, 5, 5, 5$. Median 4, mean $\tfrac{34}{9} \approx 3.8$.

A is the one with a tail to the right, which pulls the mean above the median.

Note: the book's key says C.`,
  },
  {
    n: 64,
    skill: PCT,
    page: 87,
    stem: r`A biologist mixed a solution that is 0.3% sodium chloride by mass with a solution that is 0.15% sodium chloride by mass to obtain a new solution, which has a mass of 80 grams and contains 0.21 grams of sodium chloride. How many grams of 0.3% sodium chloride solution did the biologist use?`,
    choices: [r`0.14`, r`20`, r`60`, r`79.86`],
    answer: "C",
    explanation: r`Let $x$ grams be the 0.3% solution, so $80 - x$ grams are the 0.15% solution. The sodium chloride adds up to 0.21 grams:
$$0.003x + 0.0015(80 - x) = 0.21$$
$$0.0015x + 0.12 = 0.21 \quad\Rightarrow\quad x = 60$$`,
  },
  {
    n: 65,
    skill: ONE,
    page: 88,
    stem: r`The tables give the distribution of daily travel times between two towns for bus A and bus B over a 40-day period.

**Bus A**

| Time (min) | Frequency |
|---|---|
| 44 | 5 |
| 45 | 10 |
| 47 | 15 |
| 48 | 10 |

**Bus B**

| Time (min) | Frequency |
|---|---|
| 25 | 5 |
| 30 | 10 |
| 35 | 15 |
| 40 | 10 |

Which statement correctly compares the standard deviations of travel times for bus A and bus B?`,
    choices: [
      r`The standard deviation of travel times for bus A is less than the standard deviation of travel times for bus B.`,
      r`The standard deviation of travel times for bus B is less than the standard deviation of travel times for bus A.`,
      r`The standard deviation of travel times for bus A is equal to the standard deviation of travel times for bus B.`,
      r`There is not enough information to compare these standard deviations.`,
    ],
    answer: "A",
    explanation: r`The frequencies match, but bus A's times are only 4 minutes apart from shortest to longest (44 to 48), while bus B's are 15 minutes apart (25 to 40), with gaps of 5 between each value. Bus B's times are much more spread out, so bus A has the smaller standard deviation (about 1.4 minutes against about 4.8).

Note: the book's key says C.`,
  },
  {
    n: 68,
    skill: PCT,
    page: 89,
    stem: r`In 2005, Aster earned 12% more than in 2004, and in 2006 Aster earned 6% more than in 2005. If Aster earned $y$ times as much in 2004 as in 2006, which of the following is closest to the value of $y$?`,
    choices: [r`0.5000`, r`0.7200`, r`0.8423`, r`1.1872`],
    answer: "C",
    explanation: r`Call the 2004 earnings $E$. Then 2005 is $1.12E$ and 2006 is $1.06 \times 1.12E = 1.1872E$.

2004 as a multiple of 2006:
$$y = \frac{E}{1.1872E} \approx 0.8423$$

Note: the book's key says D (1.1872), which is 2006 as a multiple of 2004, the other way around.`,
  },
  {
    n: 70,
    skill: INF,
    page: 89,
    stem: r`A survey was conducted in Arlington to estimate the percent of adult residents who support the addition of a gas station at a popular intersection in their town. Based on the survey, it is estimated that 51% of all adult residents of Arlington support the addition of a gas station at a popular intersection in their town, with an associated margin of error of 7%. Which of the following is the most appropriate conclusion about all adult residents of Arlington?`,
    choices: [
      r`The addition of a gas station at a popular intersection in the town is supported by more than 58% of all adult residents of Arlington.`,
      r`Plausible values for the percent of all adult residents of Arlington who support the addition of a gas station at a popular intersection in their town are between 44% and 58%.`,
      r`Plausible values for the percent of all adult residents of Arlington who support the addition of a gas station at a popular intersection in their town are either less than 44% or more than 58%.`,
      r`The addition of a gas station at a popular intersection in the town is supported by exactly 44% of all adult residents of Arlington.`,
    ],
    answer: "B",
    explanation: r`The estimate plus or minus the margin of error gives the plausible values: $51\% - 7\% = 44\%$ to $51\% + 7\% = 58\%$.

Values outside that range (A, C) aren't supported, and the survey can't pin down an exact percent (D).

Note: the book's key says D.`,
  },
  {
    n: 71,
    skill: PCT,
    page: 90,
    stem: r`The value of a painting increased by 186% from the end of 2011 to the end of 2012 and then decreased by 21% from the end of 2012 to the end of 2013. What was the net percentage increase in the value of the painting from the end of 2011 to the end of 2013?`,
    choices: [r`125.94%`, r`146.9%`, r`165.00%`, r`246.00%`],
    answer: "A",
    explanation: r`Up 186% multiplies by 2.86, and down 21% multiplies by 0.79:
$$2.86 \times 0.79 = 2.2594$$

The value is 225.94% of the start, a net increase of 125.94%.

Note: the book's key says C (165%), which subtracts the percents ($186 - 21$) instead of multiplying.`,
  },
  {
    n: 72,
    skill: RAT,
    page: 90,
    stem: r`The area of a rectangular region is increasing at a rate of 210 square feet per hour. Which of the following is closest to this rate in square meters per minute? (Use 1 meter = 3.28 feet.)`,
    choices: [r`0.33`, r`1.07`, r`11.48`, r`19.52`],
    answer: "A",
    explanation: r`A square meter is $3.28^2 = 10.7584$ square feet, and an hour is 60 minutes:
$$\frac{210}{10.7584 \times 60} \approx 0.33 \text{ square meters per minute}$$

Note: the book's key says D (19.52), which is the rate in square meters per hour.`,
  },
  {
    n: 77,
    skill: PROB,
    page: 92,
    stem: r`For 100 neurons, the table summarizes the distribution of classification and cell body diameter.

Cell body diameter (micrometers):

| Classification | Less than 20 | 20 to 30 | Greater than 30 |
|---|---|---|---|
| Sensory neuron | 12 | 3 | 0 |
| Motor neuron | 0 | 17 | 18 |
| Interneuron | 10 | 32 | 0 |

One of these neurons will be selected at random. What is the probability of selecting a neuron with a cell body diameter that is less than or equal to 30 micrometers, given that it is not classified as a motor neuron? (Express your answer as a decimal or fraction, not as a percent.)`,
    grid: ["1"],
    explanation: r`"Not a motor neuron" leaves the sensory neurons ($12 + 3 + 0 = 15$) and interneurons ($10 + 32 + 0 = 42$), 57 neurons.

None of them is greater than 30 micrometers, so all 57 are 30 or less:
$$P = \frac{57}{57} = 1$$

Note: the book's key says 0.32, which doesn't fit the table as printed.`,
  },
  {
    n: 78,
    skill: ONE,
    page: 92,
    stem: r`Two data sets each containing 20 integers are summarized in histograms. In each histogram, a bar represents the frequency of integers greater than or equal to the number at its left edge but less than the number at its right edge: for example, the bar from 40 to 50 counts the integers from 40 to 49. The mean of Data Set A is equal to $a$. The mean of Data Set B is equal to $b$. What is the smallest possible value of $\dfrac{b}{a}$?

${fig("ps-78", 620)}`,
    grid: ["83/122"],
    explanation: r`To make $\dfrac{b}{a}$ as small as possible, make $b$ as small as possible and $a$ as large as possible.

Smallest $b$: put every value of B at the bottom of its bar:
$$b = \frac{8(30) + 4(40) + 5(50) + 3(60)}{20} = \frac{830}{20} = 41.5$$

Largest $a$: put every value of A at the top of its bar (the largest integer below the right edge):
$$a = \frac{4(49) + 8(59) + 8(69)}{20} = \frac{1{,}220}{20} = 61$$

$$\frac{b}{a} = \frac{41.5}{61} = \frac{83}{122} \approx 0.6803$$

Note: the book's description of the bars ("the second interval represents ... at least 30 but less than 40") is garbled, so it was reworded.`,
  },
];

export const problemSolving = defineChapter({
  source: "Math Hard Book",
  prefix: "mhb-ps",
  domain: "Problem-Solving and Data Analysis",
  difficulty: "Hard",
  questions,
});
