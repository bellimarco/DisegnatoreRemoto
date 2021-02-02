

module.exports= {
  RecordDist: Infinity,

  MatePoolSize:200,
  PopuSize: 200,

  MaxGens: 200,
  Gens: 0,
  GenDelay: 400,
  GenLoop: {},

  SwapRate: 0.1,
  InvertRate: 0.07,
  ShiftRate: 0.1,

  //the start cities are from 0 to phrase.length-1,
  //the end cities are from phrase.length to (phrase.length-1)*2
  City: [],

  //a matrix with the distances between every city
  CityDist: [],
  //calculate the CityDist matrix
  CalcDist:function(){
    for(let i=0; i<this.City.length; i++){
      this.CityDist[i]=[];
      for(let j=0; j<this.City.length; j++){
        this.CityDist[i][j]=Math.sqrt(
          Math.pow(this.City[i].X-this.City[j].X,2)
          +Math.pow(this.City[i].Y-this.City[j].Y,2));
      }
    }
  },

  //array of individuals
  Popu: [],
  //array (bigger than Popu) of indexed of Popu
  MatePool: [],

  PushIndividual: function(order){
    let Individual={
      genes:order,
      fitness:0,
    }
    Individual.fitness=this.Fitness(Individual.genes);

    this.Popu.push(Individual);
  },

  Fitness: function(genes){
    //calculate the total length of the path with this order
    let dt=0;
    for(let i=0; i<genes.length-1; i++){
      if(genes[i]>=genes.length){
        dt+=this.CityDist[genes[i]-genes.length][genes[i+1]];
      }
      else{
        dt+=this.CityDist[genes[i]+genes.length][genes[i+1]];
      }
    }
    if(dt<this.RecordDist){ this.RecordDist=dt; }
    return Math.pow(dt,1);
  },
  //scale the fitness values of every individual from 0 to 1
  NormalizeFitness: function(){
    let mindist=Infinity;
    for(let i=0; i<this.Popu.length; i++){
      if(this.Popu[i].fitness<mindist){ mindist=this.Popu[i].fitness; }
    }
    //now scale
    for(let i=0; i<this.Popu.length; i++){
      this.Popu[i].fitness=mindist/this.Popu[i].fitness;
    }
  },
  //sort the population based on the fitness
  SortPopu: function(){
    this.Popu.sort((a,b)=>{return b.fitness-a.fitness});
  },
  //returns array (bigger than Popu) of indexes to the individual of the population
  SetMatingPool: function(){
    this.MatePool=[];
    //picking the individuals that reproduce with RouletteWheel algrotithm
    //array with the values of the roulette wheel to which the index corresponds
    let wheel=[];
    //optional, to have more info
    let pickcount=[];

    let fitnesssum=0;
    for(let i=0; i<this.Popu.length; i++){
      pickcount[i]=0;
      wheel.push(fitnesssum);
      //also favour even more higher fitness values with ^2 function
      fitnesssum+=Math.pow(this.Popu[i].fitness,2);
    }
    for(let i=0; i<this.MatePoolSize; i++){
      let n=Math.random()*fitnesssum;
      let pick=0;
      for(let i=0; i<wheel.length; i++){
        if(n>wheel[i]){ pick=i;}
      }
      this.MatePool.push(this.Popu[pick].genes);

      pickcount[pick]++;
    }
  },
  //returns a chromosome with crossovered genes from input
  Breed: function(p1,p2){
    let child=[];
    let childp1=[];
    let childp2=[];

    //mix genes through ordered crossover
    //pick 2 genes
    let p1gen1=Math.floor(Math.random() * p1.length);
    let p1gen2=Math.floor(Math.random() * p1.length);
    //calculate wich is the start and end gene
    let p1start=Math.min(p1gen1,p1gen2);
    let p1end=Math.max(p1gen1,p1gen2);

    //create the genese from p1
    for(let i=p1start; i<=p1end; i++){
      childp1.push(p1[i]);
    }
    //create the genes from p2
    for(let i=0; i<p2.length; i++){
      let diff=true;
      for(let j=0; j<childp1.length; j++){
        if(p2[i]==childp1[j]
          || p2[i]+this.City.length/2==childp1[j]
          || p2[i]==childp1[j]+this.City.length/2){
          diff=false;
      }}
      if(diff){ childp2.push(p2[i]); }
    }

    //unify in child
    for(let i=0; i<p1.length; i++){
      if(i<p1start){ child.push(childp2[i]); }
      else if(i>=p1start && i<=p1end){ child.push(childp1[i-p1start]); }
      else if(i>p1end){ child.push(childp2[i-(p1end-p1start+1)]); }
    }

    return child;
  },
  //randomly swaps 2 genes, and or inverts start-end
  Mutate: function(genes){
    if(Math.random()<this.ShiftRate){
      let n=Math.floor(Math.random()*(genes.length-2))+1;
      genes=genes.concat(genes.splice(0,n));
    }
    if(Math.random()<this.SwapRate){
      let g1=Math.floor(Math.random()*(genes.length-1))+1;
      let g2=Math.floor(Math.random()*(genes.length-1))+1;
      let a=genes[g1];
      genes[g1]=genes[g2];
      genes[g2]=a;
    }
    if(Math.random()<this.InvertRate){
      let g=Math.floor(Math.random()*genes.length);
      if(genes[g]>=genes.length){
        genes[g]=genes[g]-genes.length;
      }
      else{
        genes[g]=genes[g]+genes.length;
      }
    }
    return genes;
  },

  Generation: function(){
    this.SortPopu();
    this.SetMatingPool();

    this.Popu=[];
    //create new children x times
    for(let i=0; i<this.PopuSize; i++){
      //pick 2 random parents from the mating pool
      let p1=this.MatePool[Math.floor(Math.random() * this.MatePool.length)];
      let p2=this.MatePool[Math.floor(Math.random() * this.MatePool.length)];

      let child=this.Mutate(this.Breed(p1,p2));
      this.PushIndividual(child);
    }
    this.NormalizeFitness();

    this.Gens++;
    if(this.Gens>=this.MaxGens){
      clearInterval(this.GenLoop);
    }
  },
  SetGenLoop: function(){
    this.GenLoop=setInterval(()=>this.Generation(),this.GenDelay);
  },

  Reset: function(){
    this.City=[];
    this.CityDist=[];
    this.Popu=[];
    this.MatePool=[];
  },
  Setup: function(p){
    this.Reset();

    for(let i=0; i<p.length; i++){
      let start={
        X: p[i].startX,
        Y: p[i].startY,
      }
      this.City.push(start);
    }
    for(let i=0; i<p.length; i++){
      let end={
        X: p[i].endX,
        Y: p[i].endY,
      }
      this.City.push(end);
    }
    this.CalcDist();
    //City and CityDist are setup

    //create initial random population
    for(let i=0; i<this.PopuSize; i++){
      let t=[];
      let unused=[];
      for(let j=0; j<this.City.length/2; j++){
        unused.push(j);
      }
      for(let j=0; j<this.City.length/2; j++){
        let n=Math.floor(Math.random()*(this.City.length/2-j));
        if(Math.random()>0.5){ t.push(unused[n]); }
        else{ t.push(unused[n]+this.City.length/2); }
        unused.splice(n,1);
      }
      this.PushIndividual(t);
    }
    this.NormalizeFitness();

    this.Gens=0;
  },
  Generate: function(){
    for(let i=0; i<this.MaxGens; i++){
      this.Generation();
    }
  },

  AvrgFitness: function(){
    let tot=0;
    for(let i=0; i<this.Popu.length; i++){
      tot+=this.Popu[i].fitness;
    }
    return tot/this.Popu.length;
  },
  Best: function(){
    let b=0;
    for(let i=0; i<this.Popu.length; i++){
      if(this.Popu[i].fitness==1){ b=i; break; }
    }
    return this.Popu[b].genes;
  },
  //return the input path reordered according to the best individual
  Reordered: function(path){
    let best=this.Best();
    let ordered={X:[],Y:[]};
    for(let i=0; i<best.length; i++){
      let lettX=path.X[best[i]];
      let lettY=path.Y[best[i]];
      if(best[i]>=best.length){
        lettX=path.X[best[i]-best.length];
        lettY=path.Y[best[i]-best.length];
        lettX.reverse();
        lettY.reverse();
      }
      ordered.X.push(lettX);
      ordered.Y.push(lettY);
    }
    return ordered;
  }


}
