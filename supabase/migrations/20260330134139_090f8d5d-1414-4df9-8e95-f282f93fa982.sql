ALTER TABLE public.service_providers ADD COLUMN is_franchise boolean NOT NULL DEFAULT false;

-- Flag known franchises
UPDATE public.service_providers SET is_franchise = true WHERE LOWER(name) ILIKE ANY(ARRAY[
  '%firestone%', '%aamco%', '%meineke%', '%jiffy lube%', '%midas%',
  '%pep boys%', '%pepboys%', '%valvoline%', '%take 5%', '%maaco%',
  '%safelite%', '%tuffy%', '%goodyear%', '%ntb %', '%national tire%',
  '%big o tire%', '%les schwab%', '%christian brothers%',
  '%grease monkey%', '%express oil%', '%pennzoil%', '%brake masters%',
  '%sun devil%', '%monro%', '%tire kingdom%', '%tire plus%',
  '%tires plus%', '%sullivan tire%', '%belle tire%', '%discount tire%',
  '%napa autocare%', '%precision tune%', '%car-x%', '%speedy auto%',
  '%sears auto%', '%walmart auto%'
]);